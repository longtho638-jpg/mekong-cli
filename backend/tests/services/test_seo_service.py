import unittest

from backend.services.seo_service import SEOService


class TestSEOService(unittest.TestCase):
    def test_generate_sitemap(self):
        service = SEOService()
        urls = [
            {"loc": "https://agencyos.ai/", "changefreq": "daily", "priority": 1.0},
            {"loc": "https://agencyos.ai/pricing", "changefreq": "weekly", "priority": 0.8},
        ]

        xml = service.generate_sitemap(urls)

        self.assertIn('<?xml version="1.0" encoding="UTF-8"?>', xml)
        self.assertIn('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', xml)
        self.assertIn("<loc>https://agencyos.ai/</loc>", xml)
        self.assertIn("<changefreq>daily</changefreq>", xml)
        self.assertIn("<priority>1.0</priority>", xml)
        self.assertIn("<loc>https://agencyos.ai/pricing</loc>", xml)


if __name__ == "__main__":
    unittest.main()
