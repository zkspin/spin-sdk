use serde::{Deserialize, Serialize};
use std::fmt;
use wasm_bindgen::prelude::*;
#[derive(Clone, Serialize)]
#[wasm_bindgen]
pub struct RustGameState {
    pub total_steps: u64,
    pub current_position: u64,
}
