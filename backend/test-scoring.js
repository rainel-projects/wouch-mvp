
import { recalculateScores, applyScoreRules } from './services/scoringService.js';
import dotenv from 'dotenv';
dotenv.config();

const userId = 'test-verify-001';
const sessionId = 'session-verify-001';
const questionCode = 'RC_001';
const responseValue = 'opt_1';

async function test() {
    console.log('Testing Apply Score Rules...');
    try {
        const result = await applyScoreRules(userId, sessionId, questionCode, responseValue);
        console.log('Result:', result);
    } catch (error) {
        console.error('Error:', error);
    }
}

test();
