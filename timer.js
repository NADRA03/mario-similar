import { timerState } from './game.js';

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
}

export { formatTime };

export function startTimer() {
    if (!timerState.isTimerRunning) {
        timerState.isTimerRunning = true;
        timerState.timerInterval = setInterval(() => {
            if (!timerState.isPaused) {
                timerState.secondsElapsed++; // Increment by 1 second
                timerState.timerElement.innerText = "Timer : " + formatTime(timerState.secondsElapsed);
            }
        }, 1000);
    }
}

export function stopTimer() {
    clearInterval(timerState.timerInterval);
    timerState.isTimerRunning = false;
}

export function resetTimer() {
    clearInterval(timerState.timerInterval);
    timerState.secondsElapsed = 0;
    timerState.timerElement.innerText = "Timer : " + formatTime(timerState.secondsElapsed);
    timerState.isTimerRunning = false;
}
