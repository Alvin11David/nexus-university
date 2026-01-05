import * as functions from "firebase-functions";
/**
 * Cloud Function: Initiate Real MTN MoMo Payment
 * Sends USSD prompt to user's phone for real payment processing
 */
export declare const sendMTNPaymentPrompt: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Cloud Function: Check MTN Payment Status
 * Polls MTN API to check if user accepted/denied the payment
 */
export declare const checkMTNPaymentStatus: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Cloud Function: Handle MTN Payment Callback
 * Webhook endpoint that MTN calls when payment is completed
 */
export declare const mtnPaymentCallback: functions.HttpsFunction;
/**
 * Cloud Function: Initiate Real AIRTEL Money Payment
 * Sends USSD prompt to user's phone for AIRTEL payment
 */
export declare const sendAIRTELPaymentPrompt: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Cloud Function: Check AIRTEL Payment Status
 * Polls AIRTEL API to check if user accepted/denied the payment
 */
export declare const checkAIRTELPaymentStatus: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Cloud Function: Handle AIRTEL Payment Callback
 * Webhook endpoint that AIRTEL calls when payment is completed
 */
export declare const airtelPaymentCallback: functions.HttpsFunction;
