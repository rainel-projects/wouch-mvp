
import { applyScoreRules } from './services/scoringService.js';
import dotenv from 'dotenv';
dotenv.config();

const userId = 'test-verify-001'; // Ensure this is valid UUID if needed
const sessionId = 'session-verify-001'; // Ensure this is valid UUID if needed
const questionCode = 'RC_001';
const responseValue = 'opt_1';

async function test() {
    console.log('Testing...');
    try {
        await applyScoreRules(userId, sessionId, questionCode, responseValue);
        console.log('Success');
    } catch (error) {
        console.log('CAUGHT_ERROR:', error.message);
        if (error.response) console.log('Response:', error.response);
    }
}

test();
