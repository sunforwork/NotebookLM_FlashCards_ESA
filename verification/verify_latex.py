from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Page Error: {err}"))

        # Navigate to the home page
        response = page.goto("http://localhost:8080")
        print(f"Loaded page, status: {response.status}")

        # Check if renderMathInElement is defined
        is_defined = page.evaluate("() => typeof window.renderMathInElement !== 'undefined'")
        print(f"window.renderMathInElement is defined: {is_defined}")

        if not is_defined:
            # Wait a bit and try again, maybe it's slow loading
            time.sleep(2)
            is_defined = page.evaluate("() => typeof window.renderMathInElement !== 'undefined'")
            print(f"window.renderMathInElement is defined (after wait): {is_defined}")

        # Navigate to test chapter
        page.wait_for_selector(".chapter-item")
        page.click("text=test latex")

        page.wait_for_selector("#card-front-content")

        # Go to next card
        page.click("#next-btn")

        # Allow time for KaTeX to render
        time.sleep(2)

        # Check content again
        content = page.inner_html("#card-front-content")
        print(f"Front content: {content}")

        katex_element = page.locator("#card-front-content .katex")
        if katex_element.count() > 0:
            print("KaTeX element found on front!")
        else:
            print("KaTeX element NOT found on front.")

        page.screenshot(path="verification/verification.png")
        browser.close()

if __name__ == "__main__":
    run()
