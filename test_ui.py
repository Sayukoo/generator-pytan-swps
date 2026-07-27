import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Nawigacja i czekanie na zaladowanie DOM i JS
        await page.goto('http://localhost:8000')
        await page.wait_for_timeout(1000)

        # Test 1: Sprawdzenie poprawnosci tytułu
        title = await page.title()
        assert "SWPS" in title or "Generator" in title, f"Title does not match, got: {title}"

        # Test 2: Sprawdzenie czy navbar ma nadany z-index i position: sticky
        header_styles = await page.evaluate('''() => {
            const el = document.querySelector('.app-nav');
            const styles = window.getComputedStyle(el);
            return { position: styles.position, zIndex: styles.zIndex };
        }''')
        assert header_styles['position'] == 'sticky', f"Navbar is not sticky. Got: {header_styles['position']}"
        assert header_styles['zIndex'] == '90', f"Navbar z-index is not 90. Got: {header_styles['zIndex']}"

        # Sprawdzenie bledow w konsoli
        errors = []
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)

        await browser.close()

        if errors:
            print("Errors found in console:")
            for err in errors:
                print(err)
            raise AssertionError("Console errors detected")
        print("All checks passed successfully!")

if __name__ == "__main__":
    asyncio.run(run())
