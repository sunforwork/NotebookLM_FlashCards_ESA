from playwright.sync_api import sync_playwright, expect
import time

def verify_flashcards():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Emulate mobile
        context = browser.new_context(
            viewport={'width': 375, 'height': 812},
            is_mobile=True,
            has_touch=True
        )
        page = context.new_page()

        # 1. Load Home
        page.goto("http://localhost:8080")
        expect(page.locator("h1")).to_have_text("Flashcards")

        # Take screenshot of Home
        page.screenshot(path="verification/home.png")
        print("Home screenshot taken")

        # 2. Click a chapter
        page.click(".chapter-item:first-child")

        # 3. Verify Study View
        expect(page.locator(".flashcard")).to_be_visible()

        # Take screenshot of Card Front
        page.screenshot(path="verification/card_front.png")
        print("Card Front screenshot taken")

        # 4. Flip Card
        page.click(".flashcard")
        # Wait for transition
        time.sleep(1)

        # Take screenshot of Card Back
        page.screenshot(path="verification/card_back.png")
        print("Card Back screenshot taken")

        # 5. Click Next
        page.click("#next-btn")
        time.sleep(0.5)
        page.screenshot(path="verification/next_card.png")
        print("Next Card screenshot taken")

        browser.close()

if __name__ == "__main__":
    verify_flashcards()
