use wasm_bindgen::prelude::*;

use zkwasm_rust_sdk::wasm_input;
use zkwasm_rust_sdk::wasm_output;

use crate::definition::RustGameState;

use crate::gameplay::{_get_game_state, initialize_game, step};

pub fn spin() {
    // specify the public inputs
    let public_input_0_total_steps: u64 = unsafe { wasm_input(1) };
    let public_input_1_current_position: u64 = unsafe { wasm_input(1) };

    initialize_game(public_input_0_total_steps, public_input_1_current_position);

    // specify the private inputs
    let private_inputs_length = unsafe { wasm_input(0) };

    for _i in 0..private_inputs_length {
        let _private_input = unsafe { wasm_input(0) };
        step(_private_input);
    }
}

/*
    PUBLIC INPUTS marked by `wasm_input`: e.g wasm_input(1) specifies a public input of type u64
    PRIVATE INPUTS marked by `wasm_input`: e.g wasm_input(0) specifies a priva  te input of type u64
    PUBLIC OUTPUTS marked by `wasm_output`: e.g wasm_output(var) specifies an output `var` of type u64
*/
#[wasm_bindgen]
pub fn zkmain() -> i64 {
    spin();

    unsafe {
        let final_game_state: RustGameState = _get_game_state();
        zkwasm_rust_sdk::dbg!("final_game_state: {}\n", final_game_state);

        // specify the output
        wasm_output(final_game_state.total_steps as u64);
        wasm_output(final_game_state.current_position as u64);
    }

    0
}
