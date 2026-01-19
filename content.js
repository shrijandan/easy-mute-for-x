const BUTTON_CLASS = "xmute-btn";
const MUTED_ATTR = "data-xmute-attached";

const MENU_ITEM_REGEX = /^mute\b/i;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isElementVisible = (el) => {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

const waitForMenuItem = async (timeoutMs = 2000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const items = Array.from(document.querySelectorAll('[role="menuitem"]'));
    const muteItem = items.find((item) =>
      MENU_ITEM_REGEX.test(item.textContent.trim())
    );
    if (muteItem) {
      return muteItem;
    }
    await sleep(50);
  }
  return null;
};

const isConfirmButton = (el) => {
  if (!el) return false;
  if (el.classList?.contains(BUTTON_CLASS)) return false;
  const text = el.textContent.trim().toLowerCase();
  if (text !== "mute") return false;
  if (!isElementVisible(el)) return false;
  const dialog = el.closest('[role="dialog"]') || el.closest('[data-testid="sheetDialog"]');
  return Boolean(dialog);
};

const waitForConfirmButton = async (timeoutMs = 1500) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const confirm =
      document.querySelector('[data-testid="confirmationSheetConfirm"]') ||
      Array.from(document.querySelectorAll('div[role="button"], button')).find(
        isConfirmButton
      );
    if (confirm && isElementVisible(confirm)) {
      return confirm;
    }
    await sleep(50);
  }
  return null;
};

const findTweetContainer = (node) => {
  return (
    node.closest('article') ||
    node.closest('[data-testid="tweet"]') ||
    node.closest('[data-testid="cellInnerDiv"]')
  );
};

const findCaretButton = (container) => {
  if (!container) return null;
  return (
    container.querySelector('[data-testid="caret"]') ||
    container.querySelector('div[aria-label="More"]') ||
    container.querySelector('button[aria-label="More"]')
  );
};

const onMuteClick = async (event) => {
  event.preventDefault();
  event.stopPropagation();

  const button = event.currentTarget;
  const tweet = findTweetContainer(button);
  const caret = findCaretButton(tweet);
  if (!caret) {
    return;
  }

  caret.click();

  const muteItem = await waitForMenuItem();
  if (!muteItem) {
    return;
  }

  muteItem.click();

  const confirm = await waitForConfirmButton();
  if (confirm) {
    confirm.click();
  }
};

const attachButton = (userNameNode) => {
  if (!userNameNode || userNameNode.getAttribute(MUTED_ATTR) === "true") {
    return;
  }

  const container = userNameNode.parentElement;
  if (!container) return;

  const button = document.createElement("button");
  button.className = BUTTON_CLASS;
  button.type = "button";
  button.textContent = "Mute";
  button.title = "Mute this user";
  button.addEventListener("click", onMuteClick);

  userNameNode.setAttribute(MUTED_ATTR, "true");
  container.appendChild(button);
};

const scanAndAttach = () => {
  const userNameNodes = document.querySelectorAll(
    'div[data-testid="User-Name"]'
  );
  userNameNodes.forEach((node) => attachButton(node));
};

const observer = new MutationObserver(() => {
  scanAndAttach();
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});

scanAndAttach();
