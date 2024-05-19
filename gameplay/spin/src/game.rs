use once_cell::sync::Lazy;
use std::sync::Mutex;
use wasm_bindgen::prelude::*;

use gameplay::definition::{RustGameState, RustInitializationParameters};

pub static GAME_STATE: Lazy<Mutex<RustGameState>> = Lazy::new(|| Mutex::new(RustGameState::new()));

/* STATEFUL FUNCTIONS */
#[wasm_bindgen]
pub fn initialize_game(init_param: &RustInitializationParameters) {
    let mut game = GAME_STATE.lock().unwrap();
    gameplay::gameplay::initialize_game(&init_param, &mut game);
}

#[wasm_bindgen]
pub fn step(input: u64) {
    let mut game = GAME_STATE.lock().unwrap();
    gameplay::gameplay::step(input, &mut game);
}

/* PURE FUNCTIONS */
#[wasm_bindgen]
pub fn get_game_state() -> String {
    let game = _get_game_state();
    serde_json::to_string(&game).unwrap()
}

pub fn _get_game_state() -> RustGameState {
    let game = GAME_STATE.lock().unwrap().clone();
    return game;
}
