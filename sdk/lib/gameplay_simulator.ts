import { computeHashUint64Array } from "./dataHasher";
import { GameplayAbstract } from "./interface";
import { SpinGame } from "./spin_game";
import { SpinDummyProver } from "./spin_game_prover";

class GameplaySimulator {
    async simulateGame(
        gameplay: GameplayAbstract,
        initial_states: bigint[],
        player_action_inputs: bigint[]
    ) {
        const spin = new SpinGame({
            gameplay,
            gameplayProver: new SpinDummyProver(),
        });

        await spin.newGame({ initialStates: initial_states });

        for (let i = 0; i < player_action_inputs.length; i++) {
            spin.step(BigInt(player_action_inputs[i]));
        }

        const computedStates = await spin.getCurrentGameState();

        console.log(`Final state: ${computedStates}`);
        const computedFinalStateHash = computeHashUint64Array(computedStates);

        return {
            computedFinalStateHash,
            computedStates,
        };
    }
}

export { GameplaySimulator };
