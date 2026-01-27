import json
import os
from typing import Dict, List

import requests


class SEOService:
    def analyze_page(self, url: str) -> Dict:
        """Run SEO audit on a page using Google PageSpeed Insights API"""
        api_key = os.getenv('PAGESPEED_API_KEY')
        if not api_key:
            return {'error': 'PAGESPEED_API_KEY not configured'}

        try:
            response = requests.get(
                'https://www.googleapis.com/pagespeedonline/v5/runPagespeed',
                params={'url': url, 'key': api_key, 'category': 'seo'}
            )
            response.raise_for_status()
            data = response.json()

            lighthouse_result = data.get('lighthouseResult', {})
            categories = lighthouse_result.get('categories', {})
            audits = lighthouse_result.get('audits', {})

            return {
                'score': categories.get('seo', {}).get('score'),
                'audits': audits,
                'core_web_vitals': {
                    'lcp': audits.get('largest-contentful-paint', {}).get('numericValue'),
                    'fid': audits.get('max-potential-fid', {}).get('numericValue'),
                    'cls': audits.get('cumulative-layout-shift', {}).get('numericValue')
                }
            }
        except Exception as e:
            return {'error': str(e)}

    def generate_sitemap(self, urls: List[Dict]) -> str:
        """Generate XML sitemap from list of URLs"""
        # Simple generation logic mirroring the frontend one but for backend usage if needed
        xml_lines = ['<?xml version="1.0" encoding="UTF-8"?>']
        xml_lines.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

        for url_data in urls:
            loc = url_data.get('loc')
            lastmod = url_data.get('lastmod')
            changefreq = url_data.get('changefreq')
            priority = url_data.get('priority')

            xml_lines.append('  <url>')
            xml_lines.append(f'    <loc>{loc}</loc>')
            if lastmod:
                xml_lines.append(f'    <lastmod>{lastmod}</lastmod>')
            if changefreq:
                xml_lines.append(f'    <changefreq>{changefreq}</changefreq>')
            if priority is not None:
                xml_lines.append(f'    <priority>{priority}</priority>')
            xml_lines.append('  </url>')

        xml_lines.append('</urlset>')
        return '\n'.join(xml_lines)

    def submit_sitemap(self, sitemap_url: str):
        """Submit sitemap to Google Search Console"""
        # This is a placeholder. Real implementation requires OAuth2 credentials.
        # Ideally, we would use google-api-python-client
        pass
