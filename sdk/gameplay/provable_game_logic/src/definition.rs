use serde::{ Deserialize, Serialize };
use std::fmt;
use wasm_bindgen::prelude::*;

#[derive(Clone, Serialize)]
#[wasm_bindgen]
pub struct SpinGameStates {
    // define your game state here
    pub total_steps: u64,
    pub current_position: u64,
}

#[wasm_bindgen]
impl SpinGameStates {
    #[wasm_bindgen(constructor)]
    pub fn new(total_steps: u64, current_position: u64) -> SpinGameStates {
        SpinGameStates {
            total_steps: total_steps,
            current_position: current_position,
        }
    }
}

impl fmt::Display for SpinGameStates {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "GameState {{ total_steps: {}, current_position: {} }}",
            self.total_steps,
            self.current_position
        )
    }
}
