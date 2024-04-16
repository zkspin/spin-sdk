use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::fmt;
use std::sync::Mutex;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;

#[derive(Serialize, Deserialize, Clone)]
pub struct GameState {
    pub fib_number_0: u64,
    pub fib_number_1: u64,
}

impl GameState {
    pub fn new() -> GameState {
        GameState {
            fib_number_0: 0,
            fib_number_1: 0,
        }
    }
}

impl fmt::Display for GameState {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "fib_number_0: {}, fib_number_1: {}",
            self.fib_number_0, self.fib_number_1
        )
    }
}

pub static GAME_STATE: Lazy<Mutex<GameState>> = Lazy::new(|| Mutex::new(GameState::new()));

#[wasm_bindgen]
pub fn init_game() {
    let mut game = GAME_STATE.lock().unwrap();
    game.fib_number_1 = 0;
    game.fib_number_0 = 0;
}

/// Step function receives a encoded command and changes the global state accordingly
#[wasm_bindgen]
pub fn step(command: u64) {
    let mut game = GAME_STATE.lock().unwrap();
    match command {
        0 => {
            if (game.fib_number_0 == 0) {
                game.fib_number_1 = 0;
                return;
            }
            let temp = game.fib_number_1;
            game.fib_number_1 = game.fib_number_0;
            game.fib_number_0 = temp - game.fib_number_0;
        }
        1 => {
            if (game.fib_number_1 == 0) {
                game.fib_number_1 = 1;
                return;
            }
            let temp = game.fib_number_0;
            game.fib_number_0 = game.fib_number_1;
            game.fib_number_1 = temp + game.fib_number_1;
        }
        _ => {
            panic!("Invalid command");
        }
    };
}

#[wasm_bindgen]
pub fn get_fib_number_0() -> u64 {
    let game = GAME_STATE.lock().unwrap().clone();
    return game.fib_number_0;
}

#[wasm_bindgen]
pub fn get_fib_number_1() -> u64 {
    let game = GAME_STATE.lock().unwrap().clone();
    return game.fib_number_1;
}
