export class Gameplay {
    game_state: number = 0;

    constructor() {}

    step(cmd: string): string {
        // find length of the cmd
        let cmd_len = cmd.length;
        this.game_state += cmd_len;
        return `Game state: ${this.game_state}, moved ${cmd_len} steps.`;
    }
}
