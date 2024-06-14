use crate::definition::RustGameState;
use once_cell::sync::Lazy;
use std::sync::Mutex;
use wasm_bindgen::prelude::*;

pub const MAX_POSITION: u64 = 10;
pub static GAME_STATE: Lazy<Mutex<RustGameState>> = Lazy::new(|| Mutex::new(RustGameState::new()));

/* STATEFUL FUNCTIONS This defines the initialization of the game
*
* This is where you can initialize your gameplay.
* The function takes in a `seed` which could help you generate randomness.
* Note, please generate randomness purely deterministically from this seed.
*/
#[wasm_bindgen]
pub fn initialize_game(seed: u64) -> () {
    // IMPLEMENT THIS FUNCTION
    let mut game_state = GAME_STATE.lock().unwrap();

    game_state.seed = seed;
    game_state.score = 0;
}

/* STATEFUL FUNCTIONS This is defines the logic when player moves one step/entering one command
* The keyboard inputs will be passed as ASCII values, we'll only accept ASCII value from [0-127], inclusive.
*
* See the ASCII table here: https://www.ascii-code.com/
*
* The mouse click values will be passed in as input values from 1000 to 3399, this represent which character is been clicked in the 30x80 matrix.
*
* | input: u64              |    Format    |                   Value |
* | :---------------------- | :----------: | ----------------------: |
* | 0 - 127 (inclusive)     |    ASCII     |           0 - 127 ASCII |
* | 1000 - 3399 (inclusive) | Matrix Index | 0 - 2400 of the display |
*/
#[wasm_bindgen]
pub fn step(input: u64) -> () {
    // IMPLEMENT THIS FUNCTION
    let mut game_state = GAME_STATE.lock().unwrap();

    match input % 2 {
        0 => {
            if game_state.score > 0 {
                game_state.score -= 1;
            }
        }
        1 => {
            game_state.score += 1;
        }
        _ => {
            // Do nothing
        }
    };
}

/* PURE FUNCTIONS This function returns the game state, but parse into Json, so can be used in Javascript
* This is where you'll display back to the user. The string you return should be less or equal to 2400 in length.
* If the size is less than 2400, the rest of the string is padding with `space` until size is 2400.
*/
#[wasm_bindgen]
pub fn get_game_state() -> String {
    // REWRITE THIS TO RETURN A STRING TO DISPLAY
    let game = _get_game_state();
    serde_json::to_string(&game).unwrap()
}

#[wasm_bindgen]
pub fn get_game_score() -> u64 {
    // REWRITE THIS TO RETURN THE SIZE OF THE GAME STATE
    let game = _get_game_state();
    return game.score;
}

/* PURE FUNCTION This function returns the game state, to be used in Rust and Zkmain */
pub fn _get_game_state() -> RustGameState {
    let game = GAME_STATE.lock().unwrap().clone();
    return game;
}
