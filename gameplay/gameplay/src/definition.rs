use wasm_bindgen::prelude::*;

use serde::{Deserialize, Serialize};
use std::fmt;

#[wasm_bindgen]
#[derive(Serialize, Deserialize, Clone)]
pub struct RustGameState {
    pub total_steps: u64,
    pub current_position: u64,
}

#[wasm_bindgen]
#[derive(Serialize, Deserialize, Clone)]
pub struct RustInitializationParameters {
    pub total_steps: u64,
    pub current_position: u64,
}

#[wasm_bindgen]
impl RustInitializationParameters {
    #[wasm_bindgen(constructor)]
    pub fn new(total_steps: u64, current_position: u64) -> RustInitializationParameters {
        RustInitializationParameters {
            total_steps: total_steps,
            current_position: current_position,
        }
    }
}

impl RustGameState {
    pub fn new() -> RustGameState {
        RustGameState {
            total_steps: 0,
            current_position: 0,
        }
    }
}

// TODO: Implement the Display trait for RustGameState
impl fmt::Display for RustGameState {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "RustGameState {{ total_steps: {}, current_position: {} }}",
            self.total_steps, self.current_position
        )
    }
}
