import sys

from playwright.sync_api import sync_playwright


def run_playwright_task(url: str) -> str:
    """
    Runs a simple Playwright task to fetch page title.
    """
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(url)
            title = page.title()
            browser.close()
            return f"Page Title: {title}"
    except Exception as e:
        return f"Error running Playwright task: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        url_input = sys.argv[1]
    else:
        url_input = "https://example.com"

    print(f"Running Playwright task: {url_input}")
    result = run_playwright_task(url_input)
    print(f"Result: {result}")
