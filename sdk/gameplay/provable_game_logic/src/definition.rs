use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Serialize, Deserialize, Clone)]
pub struct RustGameState {
    pub total_steps: u64,
    pub current_position: u64,
}

impl RustGameState {
    pub fn new() -> RustGameState {
        RustGameState {
            total_steps: 0,
            current_position: 0,
        }
    }
}

impl fmt::Display for RustGameState {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "RustGameState {{ total_steps: {}, current_position: {} }}",
            self.total_steps, self.current_position
        )
    }
}
