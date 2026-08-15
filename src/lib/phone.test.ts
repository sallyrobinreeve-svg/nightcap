import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatPhoneForDisplay,
  isValidE164,
  parsePhoneInput,
} from "./phone.ts";

test("normalises UK numbers with a leading zero", () => {
  assert.equal(parsePhoneInput("44", "07700 900123"), "+447700900123");
});

test("normalises UK numbers without a leading zero", () => {
  assert.equal(parsePhoneInput("44", "7700900123"), "+447700900123");
});

test("accepts a pasted E.164 number", () => {
  assert.equal(parsePhoneInput("44", "+44 7700 900123"), "+447700900123");
});

test("normalises US numbers", () => {
  assert.equal(parsePhoneInput("1", "(555) 123-4567"), "+15551234567");
});

test("rejects empty input", () => {
  assert.equal(parsePhoneInput("44", "   "), null);
});

test("rejects numbers that are too short", () => {
  assert.equal(parsePhoneInput("44", "770"), null);
});

test("rejects letters", () => {
  assert.equal(parsePhoneInput("44", "not-a-number"), null);
});

test("isValidE164 accepts canonical numbers", () => {
  assert.equal(isValidE164("+447700900123"), true);
  assert.equal(isValidE164("447700900123"), false);
  assert.equal(isValidE164("+44"), false);
});

test("strips a leading country code from a national number", () => {
  assert.equal(parsePhoneInput("44", "447700900123"), "+447700900123");
});

test("formats numbers for display", () => {
  assert.equal(formatPhoneForDisplay("+447700900123"), "+44 7700900123");
});
