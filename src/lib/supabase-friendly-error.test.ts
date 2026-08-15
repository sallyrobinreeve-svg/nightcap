import assert from "node:assert/strict";
import { test } from "node:test";
import { toFriendlySupabaseMessage } from "./supabase-friendly-error.ts";

test("maps invalid OTP errors", () => {
  assert.equal(
    toFriendlySupabaseMessage("Token has expired or is invalid"),
    "That code expired. Request a new one.",
  );
  assert.equal(
    toFriendlySupabaseMessage("Invalid otp"),
    "That code doesn’t look right. Try again.",
  );
});

test("maps SMS send failures", () => {
  assert.equal(
    toFriendlySupabaseMessage("Error sending sms: Twilio is not configured"),
    "We couldn’t send a text right now. Check the number and try again in a moment.",
  );
});

test("maps invalid phone numbers", () => {
  assert.equal(
    toFriendlySupabaseMessage("Invalid phone number format"),
    "Enter a valid mobile number.",
  );
});
