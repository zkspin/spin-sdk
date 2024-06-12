export class Gameplay {
    game_state: number = 0;

    constructor() {}

    step(cmd: string): string {
        // find length of the cmd
        let cmd_len = cmd.length;
        this.game_state += cmd_len;
        return `Game state: ${this.game_state}, moved ${cmd_len} steps.`;
    }

    /**
     * return a matrix of random ASCII characters from 32-126, inclusive
     * the matrix is size of 30x80
     *
     */
    get_random_state(): number[][] {
        let state = [];
        for (let i = 0; i < 30; i++) {
            let row = [];
            for (let j = 0; j < 80; j++) {
                // row.push(Math.floor(Math.random() * 95) + 32);
                row.push(43);
            }
            state.push(row);
        }
        return state;
    }

    get_state_in_string(): string {
        let state = this.get_random_state();

        // print the size of the state matrix

        console.log(`state size: ${state.length}x${state[0].length}`);

        let state_str = "";
        for (let i = 0; i < 30; i++) {
            for (let j = 0; j < 80; j++) {
                state_str += String.fromCharCode(state[i][j]);
            }

            if (i != 29) state_str += "\r\n";
        }
        return state_str;
    }
}
