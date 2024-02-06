import { getIntentName, getRequestType, SkillBuilders } from "ask-sdk-core";
import lib from "./lib.js";

/**
 * @typedef {import("ask-sdk-core").RequestHandler} RequestHandler
 * @typedef {import("ask-sdk-core/dist/dispatcher/error/handler/CustomSkillErrorHandler.js").CustomSkillErrorHandler} ErrorHandler
 * @typedef {import("ask-sdk-core/dist/dispatcher/request/handler/HandlerInput.js").HandlerInput} HandlerInput
 * @typedef {import("ask-sdk-model").RequestEnvelope} RequestEnvelope
 */

const SKILL_NAME = "Quick Maths";
const HELP_MESSAGE = "You can say do some quick maths, or, you can say exit... What can I help you with?";
const HELP_REPROMPT = "What can I help you with?";
const FALLBACK_REPROMPT = HELP_REPROMPT;
const FALLBACK_MESSAGE = [
  "The Quick Maths skill can't help you with that.",
  "It can perform quick maths if you say do some quick maths.",
  FALLBACK_REPROMPT,
].join(" ");
const STOP_MESSAGE = lib.wrapSpeechconsInSSML("The ting goes ta ta!");

/**
 * @callback CanHandle
 * @param {HandlerInput} handlerInput
 * @returns {boolean}
 */

/**
 * @param {string} type
 * @returns {CanHandle}
 */
const matchRequestType = (type) => (handlerInput) => getRequestType(handlerInput.requestEnvelope) === type;

/**
 * @param {string[]} names
 * @returns {CanHandle}
 */
const matchIntent = (...names) => ({ requestEnvelope }) =>
  getRequestType(requestEnvelope) === "IntentRequest" && names.includes(getIntentName(requestEnvelope));

/**
 * @param {number} min
 * @param {number} max
 */
const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * @param {CanHandle} canHandle
 * @this HandlerInput
 */
function applyCanHandle(canHandle) {
  return canHandle(this);
}

/**
 * @callback Operation
 * @param {number} x
 * @param {number} y
 * @returns {number}
 * @type {Record<string, Operation}
 */
const operations = {
  plus: (x, y) => x + y,
  minus: (x, y) => x - y,
  times: (x, y) => x * y,
  "divided by": (x, y) => Math.round(x / y),
};

/** @type {RequestHandler} */
const GetQuickMathsHandler = {
  canHandle: Array.prototype.some.bind(
    [matchRequestType("LaunchRequest"), matchIntent("GetQuickMathsIntent")],
    applyCanHandle,
  ),
  handle(handlerInput) {
    const [x, y] = Array.from({ length: 2 }, () => randomNumber(1, 1000));
    const [[operationName, operation]] = Object.entries(lib.getRandomItem(operations));

    const approx = operationName === "divided by" ? "approximately " : "";
    const text = `${x} ${operationName} ${y} is ${approx}${operation(x, y)}`;

    const speechOutput = `Here goes: ${text}. Quick maths!`;

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .withSimpleCard(SKILL_NAME, speechOutput)
      .getResponse();
  },
};

/** @type {RequestHandler} */
const HelpHandler = {
  canHandle: matchIntent("AMAZON.HelpIntent"),
  handle: (handlerInput) =>
    handlerInput.responseBuilder
      .speak(HELP_MESSAGE)
      .reprompt(HELP_REPROMPT)
      .getResponse(),
};

/** @type {RequestHandler} */
const FallbackHandler = {
  // 2018-May-01: AMAZON.FallackIntent is only currently available in en-US locale.
  //              This handler will not be triggered except in that locale, so it can be
  //              safely deployed for any locale.
  canHandle: matchIntent("AMAZON.FallbackIntent"),
  handle: (handlerInput) =>
    handlerInput.responseBuilder
      .speak(FALLBACK_MESSAGE)
      .reprompt(FALLBACK_REPROMPT)
      .getResponse(),
};

/** @type {RequestHandler} */
const ExitHandler = {
  canHandle: matchIntent("AMAZON.CancelIntent", "AMAZON.StopIntent"),
  handle: (handlerInput) => handlerInput.responseBuilder.speak(STOP_MESSAGE).getResponse(),
};

/** @type {RequestHandler} */
const SessionEndedRequestHandler = {
  canHandle: matchRequestType("SessionEndedRequest"),
  handle(handlerInput) {
    console.log(
      `Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`,
    );

    return handlerInput.responseBuilder.getResponse();
  },
};

/** @type {ErrorHandler} */
const ErrorHandler = {
  canHandle: () => true,
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak("Sorry, an error occurred.")
      .reprompt("Sorry, an error occurred.")
      .getResponse();
  },
};

const skillBuilder = SkillBuilders.custom();

export const handler = skillBuilder
  .addRequestHandlers(
    GetQuickMathsHandler,
    HelpHandler,
    ExitHandler,
    FallbackHandler,
    SessionEndedRequestHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
