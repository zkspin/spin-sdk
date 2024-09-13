use serde::Serialize;

const LCG_M: u64 = 4294967296;
const LCG_A: u64 = 22695477;
const LCG_C: u64 = 1;

#[derive(Debug, Serialize, Clone, Copy)]
pub struct LCGRandGen {
    pub seed: u64,
}

impl LCGRandGen {
    pub fn new(seed: u64) -> Self {
        Self { seed }
    }

    // max is exclusive
    pub fn randint(&mut self, max: u64) -> u64 {
        self.seed = (self.seed * LCG_A + LCG_C) % LCG_M;
        (self.seed % (max as u64)) as u64
    }

    // max is exclusive
    pub fn randint_range(&mut self, min: u64, max: u64) -> u64 {
        min + self.randint(max - min)
    }
}

pub fn randint(seed: u64, max: i32) -> (u64, i32) {
    let seed = (seed * LCG_A + LCG_C) % LCG_M;
    (seed, (seed % (max as u64)) as i32)
    // (self.seed % (max as u64)) as u32
}
