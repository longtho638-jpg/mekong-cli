/**
 * Skill 08: Content Pillars & Top-of-Funnel Strategy
 */

import { BaseAgent } from './base-agent';
import { AgentInput, AgentOutput } from '../types/agent.types';

export class ContentPillarsAgent extends BaseAgent {
  skillId = '08';
  name = 'Content Pillars & Top-of-Funnel';
  dependencies = ['06', '07'];
  description = 'Define 5-7 content pillars and top-of-funnel content strategy';

  async execute(input: AgentInput): Promise<AgentOutput> {
    this.log('Defining content pillars...');

    const brand = this.getContext('07', input);
    const customerPsych = this.getContext('06', input);

    // Content Pillars (5-7 themes)
    const contentPillars = [
      {
        pillar_id: 'P1',
        name: this.markSuggestion('Industry Insights & Trends'),
        description: 'Thought leadership on market trends, data-driven insights',
        target_audience: 'Industry professionals, decision-makers',
        content_types: ['Blog posts', 'Whitepapers', 'LinkedIn articles', 'Infographics'],
        example_topics: [
          this.markSuggestion('State of [Industry] 2026 Report'),
          'Top 10 trends shaping [Market]',
          'Data breakdown: [Metric] in SEA region'
        ],
        kpis: ['Traffic', 'Time on page', 'Social shares', 'Backlinks']
      },
      {
        pillar_id: 'P2',
        name: this.markSuggestion('Product Education & How-To'),
        description: 'Tutorials, guides, best practices for using product',
        target_audience: 'Current users, prospects evaluating product',
        content_types: ['Video tutorials', 'Help articles', 'Webinars', 'Case studies'],
        example_topics: [
          'How to [achieve outcome] in 5 steps',
          'Complete guide to [feature]',
          'Common mistakes and how to avoid them'
        ],
        kpis: ['Help article views', 'Video completion rate', 'Feature adoption']
      },
      {
        pillar_id: 'P3',
        name: this.markSuggestion('Customer Success Stories'),
        description: 'Real results from real customers, social proof',
        target_audience: 'Prospects in consideration phase',
        content_types: ['Case studies', 'Video testimonials', 'Before/after comparisons'],
        example_topics: [
          'How [Customer] achieved X% growth',
          '[Company] saved [Amount] using [Product]',
          'Success story: From problem to solution'
        ],
        kpis: ['Conversion rate', 'Sales enablement usage', 'Trust indicators']
      },
      {
        pillar_id: 'P4',
        name: this.markSuggestion('Company Culture & Behind-the-Scenes'),
        description: 'Humanize brand, attract talent, build community',
        target_audience: 'Job seekers, community, brand followers',
        content_types: ['Employee spotlights', 'Office tours', 'Founder stories', 'Values posts'],
        example_topics: [
          'Day in the life of [Role]',
          'How we built [Feature]',
          'Our remote-first culture'
        ],
        kpis: ['Employer brand score', 'Job applications', 'Employee advocacy']
      },
      {
        pillar_id: 'P5',
        name: this.markSuggestion('Problem-Solution Frameworks'),
        description: 'Address customer pain points, position product as solution',
        target_audience: 'Problem-aware prospects',
        content_types: ['Problem breakdowns', 'Solution comparisons', 'ROI calculators'],
        example_topics: [
          'The hidden cost of [Problem]',
          '[Problem] vs [Solution approach]',
          'Is [Product category] right for you?'
        ],
        kpis: ['Lead generation', 'Demo requests', 'Email signups']
      }
    ];

    // Content Calendar Framework
    const contentCalendar = {
      weekly_cadence: {
        blog_posts: '2-3 per week',
        social_media: '1-2 per day (LinkedIn, Facebook)',
        email_newsletter: '1 per week',
        video_content: '1 per week'
      },
      monthly_themes: this.markSuggestion('Align with product launches, industry events, seasonal trends'),
      quarterly_campaigns: [
        { Q: 'Q1', theme: this.markSuggestion('New Year Planning & Goal Setting') },
        { Q: 'Q2', theme: this.markSuggestion('Mid-Year Review & Optimization') },
        { Q: 'Q3', theme: this.markSuggestion('Scaling & Growth Strategies') },
        { Q: 'Q4', theme: this.markSuggestion('Year-End Wrap Up & 2027 Trends') }
      ]
    };

    // Distribution Strategy
    const distributionStrategy = {
      owned_channels: {
        blog: this.markSuggestion('SEO-optimized, comprehensive articles (1500-2500 words)'),
        email: 'Newsletter + nurture sequences',
        website: 'Resource library, downloadable guides',
        youtube: this.markSuggestion('Video library, playlists by pillar')
      },
      earned_channels: {
        guest_posts: this.markSuggestion('Target top industry publications'),
        podcasts: 'Guest appearances on relevant shows',
        partnerships: 'Co-marketing with complementary brands',
        pr: this.markSuggestion('Press releases for major announcements')
      },
      paid_channels: {
        content_promotion: 'Boost top posts on social',
        sponsored_content: this.markSuggestion('Native ads in industry publications'),
        retargeting: 'Retarget blog visitors with relevant content',
        influencer: this.markAssumption('Micro-influencer partnerships')
      }
    };

    // SEO Strategy
    const seoStrategy = {
      target_keywords: {
        seed_keywords: this.markSuggestion('[Product category], [Problem] solution, [Industry] software'),
        long_tail: 'How to [specific outcome], Best [product category] for [use case]',
        local: this.markSuggestion('[Product category] Vietnam, [Industry] tools SEA')
      },
      content_optimization: [
        'Internal linking between pillar content',
        'Topic clusters around each pillar',
        'Rich snippets and structured data',
        'Mobile optimization',
        'Page speed < 3 seconds'
      ],
      backlink_strategy: this.markSuggestion('Guest posting, digital PR, resource pages, partnerships')
    };

    // Content Workflow
    const contentWorkflow = {
      ideation: 'Weekly brainstorm, align with pillars and calendar',
      production: {
        research: '2-3 days',
        writing: '2-4 days',
        review: '1 day',
        design: '1-2 days (graphics/video)',
        approval: '1 day'
      },
      publishing: 'Schedule via CMS, coordinate with social team',
      promotion: 'Share across all channels within 24 hours',
      performance_review: 'Weekly metrics review, monthly deep dive'
    };

    return this.createOutput({
      content_pillars: contentPillars,
      content_calendar_framework: contentCalendar,
      distribution_strategy: distributionStrategy,
      seo_strategy: seoStrategy,
      content_workflow: contentWorkflow,
      success_metrics: {
        traffic: ['Monthly visitors', 'Page views', 'Bounce rate', 'Time on site'],
        engagement: ['Social shares', 'Comments', 'Video views', 'Downloads'],
        conversion: ['Email signups', 'Demo requests', 'Free trial starts'],
        seo: ['Keyword rankings', 'Organic traffic', 'Backlinks', 'Domain authority']
      }
    }, {
      dependenciesUsed: ['06', '07'],
      dataQuality: 'high'
    });
  }
}
