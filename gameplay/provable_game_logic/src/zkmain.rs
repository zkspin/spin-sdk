use wasm_bindgen::prelude::*;

use zkwasm_rust_sdk::wasm_input;
use zkwasm_rust_sdk::wasm_output;

use crate::game::{_get_game_state, init_game, step, GameState};

// Private input:   #commands, command 0, command n, ..., last command
// Public input:    seed, address
// Public output:   score

#[wasm_bindgen]
pub fn zkmain() -> i64 {
    // specify the public inputs
    let total_steps: u64 = unsafe { wasm_input(1) };
    let current_position: u64 = unsafe { wasm_input(1) };

    // init game
    init_game(total_steps, current_position);

    // specify the private inputs
    let commands_len = unsafe { wasm_input(0) };

    for _i in 0..commands_len {
        let command = unsafe { wasm_input(0) };
        step(command);
    }

    unsafe {
        let final_game_state: GameState = _get_game_state();

        zkwasm_rust_sdk::dbg!("final_game_state: {}\n", final_game_state);

        // specify the output
        wasm_output(final_game_state.total_steps as u64);
        wasm_output(final_game_state.current_position as u64);
    }

    0
}
