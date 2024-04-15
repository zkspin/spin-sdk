use wasm_bindgen::prelude::*;

use zkwasm_rust_sdk::wasm_input;
use zkwasm_rust_sdk::wasm_output;

use crate::game::{get_fib_number_0, get_fib_number_1, init, step};

// Private input:   #commands, command 0, command n, ..., last command
// Public input:    seed, address
// Public output:   score

#[wasm_bindgen]
pub fn zkmain() -> i64 {
    // init game
    let address = unsafe { [wasm_input(1), wasm_input(1), wasm_input(1)] };
    zkwasm_rust_sdk::dbg!("l1 player address is {:?}\n", address);

    init();

    // run the game
    let commands_len = unsafe { wasm_input(0) };

    for _i in 0..commands_len {
        let command = unsafe { wasm_input(0) };
        step(command);
    }

    unsafe {
        let number0 = get_fib_number_0();
        let number1 = get_fib_number_1();
        zkwasm_rust_sdk::dbg!("fib_number_0: {}\n", number0);
        wasm_output(number0 as u64);
        wasm_output(number1 as u64);
    }

    0
}
