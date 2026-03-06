import { Command } from 'commander';
import { MockDataProvider } from '../data/MockDataProvider';
import { BacktestRunner } from '../backtest/BacktestRunner';
import { IDataProvider } from '../interfaces/IDataProvider';
import { StrategyLoader } from '../core/StrategyLoader';
import { LicenseService, LicenseTier, LicenseError } from '../lib/raas-gate';
import { QLearningStrategy } from '../ml/tabular-q-learning-rl-trading-strategy';
import { QLearningEpisodeTrainer } from '../ml/tabular-q-learning-episode-trainer';
import { GruPricePredictionModel } from '../ml/gru-price-prediction-model';
import { GruPredictionStrategy } from '../ml/gru-prediction-strategy';
import { FeatureEngineeringPipeline } from '../ml/feature-engineering-candle-to-vector-pipeline';
import { ICandle } from '../interfaces/ICandle';
import { logger } from '../utils/logger';

/** Simple data provider wrapping a fixed candle array for backtesting. */
class FixedCandleProvider implements IDataProvider {
  constructor(private candles: ICandle[]) {}
  async init(): Promise<void> {}
  subscribe(): void {}
  async getHistory(limit: number): Promise<ICandle[]> { return this.candles.slice(-limit); }
  async start(): Promise<void> {}
  async stop(): Promise<void> {}
}

/** Build training labels from candle data: 1 if next close > current, else 0. */
function buildGruTrainingData(candles: ICandle[], windowSize: number) {
  const pipeline = new FeatureEngineeringPipeline();
  const features = pipeline.extract(candles);
  const windows = FeatureEngineeringPipeline.toWindows(features, windowSize);

  const alignedStart = candles.length - features.length;
  const labels: number[] = [];
  for (let i = 0; i < windows.length; i++) {
    const idx = alignedStart + windowSize + i;
    if (idx >= candles.length) break;
    labels.push(candles[idx].close > candles[idx - 1].close ? 1 : 0);
  }

  return { windows: windows.slice(0, labels.length), labels };
}

export function registerMLCommands(program: Command): void {
  program
    .command('ml:train:qlearn')
    .description('Train Q-learning RL strategy on historical data (PRO feature)')
    .option('-e, --episodes <number>', 'Training episodes', '50')
    .option('-d, --days <number>', 'Days of historical data', '90')
    .option('--epsilon <number>', 'Initial exploration rate', '0.5')
    .option('--lr <number>', 'Learning rate', '0.1')
    .action(async (options) => {
      // Gate premium feature
      const licenseService = LicenseService.getInstance();
      if (!licenseService.hasTier(LicenseTier.PRO)) {
        throw new LicenseError(
          'ml:train:qlearn requires PRO license',
          LicenseTier.PRO,
          'ml_training'
        );
      }

      const episodes = parseInt(options.episodes, 10);
      const days = parseInt(options.days, 10);

      logger.info(`Training Q-Learning: ${episodes} episodes, ${days} days data`);

      const dataProvider = new MockDataProvider();
      const candles = await dataProvider.getHistory(days * 24);

      const strategy = new QLearningStrategy({
        epsilon: parseFloat(options.epsilon),
        learningRate: parseFloat(options.lr),
      });
      const trainer = new QLearningEpisodeTrainer();

      const result = trainer.train(strategy, candles, episodes);

      logger.info(`Training complete:`);
      logger.info(`  Episodes: ${result.episodes}`);
      logger.info(`  States explored: ${result.statesExplored}`);
      logger.info(`  Final epsilon: ${result.finalEpsilon.toFixed(4)}`);
      logger.info(`  Avg reward: ${result.avgReward.toFixed(6)}`);
      logger.info(`  Time: ${result.trainingTimeMs}ms`);

      // Register trained strategy for backtest
      StrategyLoader.registerFactory('QLearning', () => strategy);
      logger.info('Trained Q-Learning strategy registered. Run backtest with: --strategy QLearning');
    });

  program
    .command('ml:train:gru')
    .description('Train GRU price prediction model (PRO feature)')
    .option('-e, --epochs <number>', 'Training epochs', '20')
    .option('-d, --days <number>', 'Days of historical data', '90')
    .option('-w, --window <number>', 'Lookback window size', '30')
    .option('--units <number>', 'GRU hidden units', '32')
    .option('--batch <number>', 'Batch size', '32')
    .action(async (options) => {
      // Gate premium feature
      const licenseService = LicenseService.getInstance();
      if (!licenseService.hasTier(LicenseTier.PRO)) {
        throw new LicenseError(
          'ml:train:gru requires PRO license',
          LicenseTier.PRO,
          'ml_training'
        );
      }

      const epochs = parseInt(options.epochs, 10);
      const days = parseInt(options.days, 10);
      const windowSize = parseInt(options.window, 10);
      const gruUnits = parseInt(options.units, 10);
      const batchSize = parseInt(options.batch, 10);

      logger.info(`Training GRU: ${epochs} epochs, ${days} days, window=${windowSize}, units=${gruUnits}`);

      const dataProvider = new MockDataProvider();
      const candles = await dataProvider.getHistory(days * 24);

      const { windows, labels } = buildGruTrainingData(candles, windowSize);
      logger.info(`Training data: ${windows.length} samples`);

      const model = new GruPricePredictionModel({
        windowSize,
        numFeatures: 7,
        gruUnits,
        denseUnits: Math.floor(gruUnits / 2),
      });

      const result = await model.train(windows, labels, epochs, batchSize);

      logger.info(`Training complete:`);
      logger.info(`  Epochs: ${result.epochs}`);
      logger.info(`  Final loss: ${result.finalLoss.toFixed(6)}`);
      logger.info(`  Time: ${result.trainingTimeMs}ms`);

      // Register trained strategy for backtest
      const strategy = new GruPredictionStrategy(model, { windowSize });
      StrategyLoader.registerFactory('GruPrediction', () => strategy);
      logger.info('Trained GRU strategy registered. Run backtest with: --strategy GruPrediction');
    });

  program
    .command('ml:backtest')
    .description('Train ML strategy and immediately backtest it (PRO feature)')
    .option('-m, --model <string>', 'ML model (QLearning, GruPrediction)', 'QLearning')
    .option('-d, --days <number>', 'Days of data (split: 70% train, 30% test)', '90')
    .option('-b, --balance <number>', 'Initial balance for backtest', '10000')
    .option('-e, --episodes <number>', 'Training episodes/epochs', '30')
    .action(async (options) => {
      // Gate premium feature
      const licenseService = LicenseService.getInstance();
      if (!licenseService.hasTier(LicenseTier.PRO)) {
        throw new LicenseError(
          'ml:backtest requires PRO license',
          LicenseTier.PRO,
          'ml_training'
        );
      }

      const modelType = options.model;
      const days = parseInt(options.days, 10);
      const balance = parseFloat(options.balance);
      const episodes = parseInt(options.episodes, 10);

      logger.info(`ML Backtest: ${modelType}, ${days} days, $${balance} balance`);

      const dataProvider = new MockDataProvider();
      const allCandles = await dataProvider.getHistory(days * 24);

      const splitIdx = Math.floor(allCandles.length * 0.7);
      const trainCandles = allCandles.slice(0, splitIdx);
      const testCandles = allCandles.slice(splitIdx);

      logger.info(`Data split: ${trainCandles.length} train, ${testCandles.length} test candles`);

      let strategy: QLearningStrategy | GruPredictionStrategy;

      if (modelType === 'QLearning') {
        const qStrategy = new QLearningStrategy({ epsilon: 0.5 });
        const trainer = new QLearningEpisodeTrainer();
        const trainResult = trainer.train(qStrategy, trainCandles, episodes);
        logger.info(`Q-Learning trained: ${trainResult.statesExplored} states, ${trainResult.trainingTimeMs}ms`);
        strategy = qStrategy;
      } else {
        const windowSize = 30;
        const { windows, labels } = buildGruTrainingData(trainCandles, windowSize);
        const model = new GruPricePredictionModel({ windowSize, numFeatures: 7, gruUnits: 32, denseUnits: 16 });
        const trainResult = await model.train(windows, labels, episodes, 32);
        logger.info(`GRU trained: loss=${trainResult.finalLoss.toFixed(6)}, ${trainResult.trainingTimeMs}ms`);
        strategy = new GruPredictionStrategy(model, { windowSize });
      }

      // Backtest on test data
      const testProvider = new FixedCandleProvider(testCandles);
      const runner = new BacktestRunner(strategy, testProvider, balance);
      await runner.run(Math.ceil(testCandles.length / 24));

      logger.info('ML backtest complete.');
    });
}
