use wasm_bindgen::prelude::*;

use zkwasm_rust_sdk::wasm_input;
use zkwasm_rust_sdk::wasm_output;

use provable_game_logic::definition::{RustGameState, RustInitializationParameters};

use crate::game::{_get_game_state, initialize_game, step};

// Private input:   #commands, command 0, command n, ..., last command
// Public input:    seed, address
// Public output:   score

#[wasm_bindgen]
pub fn zkmain() -> i64 {
    // specify the public inputs
    let total_steps: u64 = unsafe { wasm_input(1) };
    let current_position: u64 = unsafe { wasm_input(1) };

    let init_param = RustInitializationParameters {
        total_steps,
        current_position,
    };
    // init game
    initialize_game(&init_param);

    // specify the private inputs
    let input_length = unsafe { wasm_input(0) };

    for _i in 0..input_length {
        let input_length = unsafe { wasm_input(0) };
        step(input_length);
    }

    unsafe {
        let final_game_state: RustGameState = _get_game_state();

        zkwasm_rust_sdk::dbg!("final_game_state: {}\n", final_game_state);

        // specify the output
        wasm_output(final_game_state.total_steps as u64);
        wasm_output(final_game_state.current_position as u64);
    }

    0
}
