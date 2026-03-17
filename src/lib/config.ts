/**
 * Application Configuration
 * Central configuration file for app-wide constants
 */

// The hosting URL for the Nexus University Portal
// This is used for generating QR codes and sharing links
export const HOSTING_URL = "https://universityportal2026.web.app";

/**
 * Generate a QR code URL for sharing results
 * @param studentId - The unique student ID
 * @returns The full URL for results page
 */
export const getResultsShareUrl = (studentId: string): string => {
  return `${HOSTING_URL}/results?student=${studentId}`;
};

/**
 * Generate a QR code URL for sharing timetable
 * @returns The full URL for timetable page
 */
export const getTimetableShareUrl = (): string => {
  return `${HOSTING_URL}/timetable`;
};

/**
 * Generate a QR code URL for ID card verification
 * @param studentId - The unique student ID
 * @returns The full URL for ID card verification
 */
export const getIdCardShareUrl = (studentId: string): string => {
  return `${HOSTING_URL}/id-card?student=${studentId}`;
};

/**
 * Generate a QR code URL for enrollment verification
 * @param studentId - The unique student ID
 * @returns The full URL for enrollment verification
 */
export const getEnrollmentShareUrl = (studentId: string): string => {
  return `${HOSTING_URL}/enrollment?student=${studentId}`;
};

/**
 * Generate a QR code URL for PRN verification
 * @param prnCode - The payment reference number
 * @returns The full URL for PRN verification
 */
export const getPRNShareUrl = (prnCode: string): string => {
  return `${HOSTING_URL}/prn-check?code=${prnCode}`;
};
