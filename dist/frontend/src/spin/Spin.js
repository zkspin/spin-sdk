"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Spin = void 0;
const GamePlay_1 = require("./GamePlay");
const Proof_1 = require("./Proof");
/* This Class is used to facilated core gameplay and zk proving*/
class Spin {
    /* Constructor */
    constructor({ onReady, cloudCredentials }) {
        this.inputs = []; // public inputs
        this.witness = []; // private inputs
        this.gamePlay = new GamePlay_1.GamePlay({
            callback: onReady,
        });
        this.cloudCredentials = cloudCredentials;
    }
    add_public_input(input) {
        this.inputs.push(input);
    }
    add_private_input(input) {
        this.witness.push(input);
    }
    // ================================================================================================
    // BELOW FUNCTIONS CAN BE AUTO-GENERATED
    /* Step the game
     * part of the private inputs
     */
    step(command) {
        this.gamePlay.step(command);
    }
    /* Get the current game state */
    getGameState() {
        return this.gamePlay.getGameState();
    }
    init_game({ total_steps, current_position }) {
        this.gamePlay.init_game({ total_steps, current_position });
    }
    // ================================================================================================
    submitProof() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("generating proof");
            const tasksInfo = yield (0, Proof_1.add_proving_taks)(this.inputs.map((i) => `${i}:i64`), [
                `${this.witness.length}:i64`,
                ...this.witness.map((m) => `${m}:i64`),
            ], this.cloudCredentials);
            console.log("tasks =", tasksInfo);
            const task_id = tasksInfo.id;
            const proof = yield (0, Proof_1.load_proving_taks_util_result)(task_id, this.cloudCredentials);
            console.log("proof = ", proof);
            return proof;
        });
    }
    /* Reset the game
     * Keeping the same onReady callback and cloud credentials
     */
    reset(onReady) {
        this.inputs = [];
        this.witness = [];
        this.gamePlay = new GamePlay_1.GamePlay({
            callback: onReady,
        });
    }
}
exports.Spin = Spin;
//# sourceMappingURL=Spin.js.map