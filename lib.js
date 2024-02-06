import fs from "node:fs/promises";

/** @type {string[]} */
const speechcons = JSON.parse(
  await fs.readFile(new URL("./speechcons.json", import.meta.url)),
);

export default {
  /**
   * @template {unknown[]|Record<string, unknown>} Input
   * @param {Input} input
   * @returns {Input extends unknown[] ? Input[number] : Input}
   */
  getRandomItem(input) {
    if (Array.isArray(input)) {
      const i = Math.floor(Math.random() * input.length);
      return input[i];
    }

    if (typeof input === "object") {
      const key = this.getRandomItem(Object.keys(input));
      return { [key]: input[key] };
    }

    return input;
  },
  /** @param {string} textToSearch */
  wrapSpeechconsInSSML(textToSearch) {
    let text = textToSearch;

    for (const element of speechcons) {
      const elementWithSSML = `,<say-as interpret-as="interjection">${element}</say-as>,`;
      text = text.replace(element, elementWithSSML);
    }

    return text;
  },
};
