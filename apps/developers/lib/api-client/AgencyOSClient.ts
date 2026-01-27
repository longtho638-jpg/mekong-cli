/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseHttpRequest } from './core/BaseHttpRequest';
import type { OpenAPIConfig } from './core/OpenAPI';
import { FetchHttpRequest } from './core/FetchHttpRequest';
import { AccountingService } from './services/AccountingService';
import { AgentOpsService } from './services/AgentOpsService';
import { AgentsService } from './services/AgentsService';
import { AgentsCreatorService } from './services/AgentsCreatorService';
import { AnalyticsService } from './services/AnalyticsService';
import { AuditService } from './services/AuditService';
import { AuthService } from './services/AuthService';
import { CampaignsService } from './services/CampaignsService';
import { DefaultService } from './services/DefaultService';
import { GumroadWebhooksService } from './services/GumroadWebhooksService';
import { HrService } from './services/HrService';
import { HybridRouterService } from './services/HybridRouterService';
import { InventoryService } from './services/InventoryService';
import { InvoicesService } from './services/InvoicesService';
import { MekongCommandsService } from './services/MekongCommandsService';
import { MonitorService } from './services/MonitorService';
import { OpsService } from './services/OpsService';
import { PaymentsService } from './services/PaymentsService';
import { PayPalWebhooksService } from './services/PayPalWebhooksService';
import { RevenueService } from './services/RevenueService';
import { StripeWebhooksService } from './services/StripeWebhooksService';
import { SwarmService } from './services/SwarmService';
import { VibeTunerService } from './services/VibeTunerService';
import { WebsocketService } from './services/WebsocketService';
import { WorkflowService } from './services/WorkflowService';
type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;
export class AgencyOSClient {
    public readonly accounting: AccountingService;
    public readonly agentOps: AgentOpsService;
    public readonly agents: AgentsService;
    public readonly agentsCreator: AgentsCreatorService;
    public readonly analytics: AnalyticsService;
    public readonly audit: AuditService;
    public readonly auth: AuthService;
    public readonly campaigns: CampaignsService;
    public readonly default: DefaultService;
    public readonly gumroadWebhooks: GumroadWebhooksService;
    public readonly hr: HrService;
    public readonly hybridRouter: HybridRouterService;
    public readonly inventory: InventoryService;
    public readonly invoices: InvoicesService;
    public readonly mekongCommands: MekongCommandsService;
    public readonly monitor: MonitorService;
    public readonly ops: OpsService;
    public readonly payments: PaymentsService;
    public readonly payPalWebhooks: PayPalWebhooksService;
    public readonly revenue: RevenueService;
    public readonly stripeWebhooks: StripeWebhooksService;
    public readonly swarm: SwarmService;
    public readonly vibeTuner: VibeTunerService;
    public readonly websocket: WebsocketService;
    public readonly workflow: WorkflowService;
    public readonly request: BaseHttpRequest;
    constructor(config?: Partial<OpenAPIConfig>, HttpRequest: HttpRequestConstructor = FetchHttpRequest) {
        this.request = new HttpRequest({
            BASE: config?.BASE ?? '',
            VERSION: config?.VERSION ?? '3.0.0',
            WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
            CREDENTIALS: config?.CREDENTIALS ?? 'include',
            TOKEN: config?.TOKEN,
            USERNAME: config?.USERNAME,
            PASSWORD: config?.PASSWORD,
            HEADERS: config?.HEADERS,
            ENCODE_PATH: config?.ENCODE_PATH,
        });
        this.accounting = new AccountingService(this.request);
        this.agentOps = new AgentOpsService(this.request);
        this.agents = new AgentsService(this.request);
        this.agentsCreator = new AgentsCreatorService(this.request);
        this.analytics = new AnalyticsService(this.request);
        this.audit = new AuditService(this.request);
        this.auth = new AuthService(this.request);
        this.campaigns = new CampaignsService(this.request);
        this.default = new DefaultService(this.request);
        this.gumroadWebhooks = new GumroadWebhooksService(this.request);
        this.hr = new HrService(this.request);
        this.hybridRouter = new HybridRouterService(this.request);
        this.inventory = new InventoryService(this.request);
        this.invoices = new InvoicesService(this.request);
        this.mekongCommands = new MekongCommandsService(this.request);
        this.monitor = new MonitorService(this.request);
        this.ops = new OpsService(this.request);
        this.payments = new PaymentsService(this.request);
        this.payPalWebhooks = new PayPalWebhooksService(this.request);
        this.revenue = new RevenueService(this.request);
        this.stripeWebhooks = new StripeWebhooksService(this.request);
        this.swarm = new SwarmService(this.request);
        this.vibeTuner = new VibeTunerService(this.request);
        this.websocket = new WebsocketService(this.request);
        this.workflow = new WorkflowService(this.request);
    }
}

