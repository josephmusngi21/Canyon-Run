class Timer {
    // Basic timer that will increment every millisecond
    constructor(start = 0, end) {
        this.start = [start, 0];
        this.end = end;
        this.count = this.start;
        this.cont = true;
    }

    startTimer() {
        if (this.cont) {
            this.interval = setInterval(() => {
                // Increment milliseconds
                this.count[1]++;
                if (this.count[1] === 1000) {
                    this.count[0]++;
                    this.count[1] = 0;
                }
            }, 1);
        } else {
            clearInterval(this.interval);
            return this.count;
        }
    }

    endTimer() {
        this.cont = false;
        clearInterval(this.interval);
    }

    showCurrentTime() {
        return `${this.count[0]} seconds and ${this.count[1]} milliseconds`;
    }

    resetTimer() {
        this.count = this.start;
    }
}
