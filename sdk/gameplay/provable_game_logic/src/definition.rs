use serde::{Deserialize, Serialize};
use std::fmt;
use wasm_bindgen::prelude::*;

#[derive(Clone, Serialize)]
#[wasm_bindgen]
pub struct SpinGameInitArgs {
    // define your arguments here
    pub total_steps: u64,
    pub current_position: u64,
}

#[wasm_bindgen]
impl SpinGameInitArgs {
    #[wasm_bindgen(constructor)]
    pub fn new(total_steps: u64, current_position: u64) -> SpinGameInitArgs {
        SpinGameInitArgs {
            total_steps,
            current_position,
        }
    }
}

#[derive(Clone, Serialize)]
#[wasm_bindgen]
pub struct SpinGameIntermediateStates {
    // define your game state here
    pub total_steps: u64,
    pub current_position: u64,
}

impl SpinGameIntermediateStates {
    pub fn new() -> SpinGameIntermediateStates {
        SpinGameIntermediateStates {
            total_steps: 0,
            current_position: 0,
        }
    }
}

impl fmt::Display for SpinGameIntermediateStates {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "GameState {{ total_steps: {}, current_position: {} }}",
            self.total_steps, self.current_position
        )
    }
}
