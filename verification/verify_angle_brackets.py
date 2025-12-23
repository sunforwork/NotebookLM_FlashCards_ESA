from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the home page
        page.goto("http://localhost:8080")

        # Navigate to test chapter
        page.wait_for_selector(".chapter-item")
        page.click("text=test angle brackets")

        page.wait_for_selector("#card-front-content")

        # Go to next card (id 1: Code with <vector>)
        page.click("#next-btn")

        time.sleep(1)

        back_content = page.locator("#card-back-content").text_content()
        print(f"Card 1 Back: {back_content}")
        if "#include <vector>" in back_content:
            print("Angle brackets preserved in text.")
        else:
            print("Angle brackets MISSING in text.")

        # Go to next card (id 2: Math inequality)
        page.click("#next-btn")
        time.sleep(1)

        back_content = page.locator("#card-back-content").text_content()
        print(f"Card 2 Back (raw text content): {back_content}")

        # Check for KaTeX rendering
        katex_count = page.locator("#card-back-content .katex").count()
        if katex_count > 0:
            print("KaTeX rendered inequality.")
        else:
            print("KaTeX NOT rendered inequality.")

        page.screenshot(path="verification/verification_angle.png")
        browser.close()

if __name__ == "__main__":
    run()
