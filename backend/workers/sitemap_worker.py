# Sitemap Worker
# This worker is responsible for regenerating the sitemap periodically.
# It simulates a periodic task. In a real environment, this would be triggered by Celery beat or similar.

import logging
import os

from backend.services.seo_service import SEOService

logger = logging.getLogger(__name__)

def regenerate_sitemap():
    """Regenerate sitemap daily"""
    logger.info("Starting sitemap regeneration")

    # In a real app, you would fetch these from your database
    static_urls = [
        {'loc': 'https://agencyos.ai/', 'changefreq': 'daily', 'priority': 1.0},
        {'loc': 'https://agencyos.ai/pricing', 'changefreq': 'weekly', 'priority': 0.8},
        {'loc': 'https://agencyos.ai/docs', 'changefreq': 'weekly', 'priority': 0.7}
    ]

    seo_service = SEOService()
    sitemap_xml = seo_service.generate_sitemap(static_urls)

    # Write to a file that can be served
    # Assuming we are in the root of the project or backend
    output_path = os.path.join(os.getcwd(), 'public', 'sitemap.xml')

    # Ensure public dir exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, 'w') as f:
        f.write(sitemap_xml)

    logger.info(f"Sitemap generated at {output_path}")

    # Submit to Google
    # seo_service.submit_sitemap('https://agencyos.ai/sitemap.xml')

if __name__ == "__main__":
    regenerate_sitemap()
