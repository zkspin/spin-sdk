import { GamePlay } from "spinlib";

function main() {
    const game = new GamePlay({
        callback: () => {
            game.init_game({
                total_steps: 10,
                current_position: 0,
            });
            game.step(1);
            console.log(game.getGameState());
        },
    });
}

main();
