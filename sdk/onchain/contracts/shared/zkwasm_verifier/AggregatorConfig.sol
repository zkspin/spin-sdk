// SPDX-License-Identifier: MIT
// Tells the Solidity compiler to compile only from v0.8.13 to v0.9.0
pragma solidity ^0.8.13;

import "./AggregatorLib.sol";

library AggregatorConfig {
    function fill_verify_circuits_g2(uint256[] memory s) internal pure {
        s[2] = 10912121346736960153119032326674308622836895172287017181004332853287395747540;
        s[3] = 1141242303575873671169773919745529817497021056319105990006251901769180589131;
        s[4] = 13736722489223410979012950988289654946078517441362861355057236908979399480985;
        s[5] = 17920167001006791983741102148022475408561884350390649459550129912018198675534;

        s[8] = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
        s[9] = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
        s[10] = 17805874995975841540914202342111839520379459829704422454583296818431106115052;
        s[11] = 13392588948715843804641432497768002650278120570034223513918757245338268106653;
    }

    function calc_verify_circuit_lagrange(uint256[] memory buf) internal view {
        buf[0] = 2735708597799451452160332461848350692128893288992167946537450125562183732533;
        buf[1] = 16512170175385812892195391099574916023024416995263347775961451770318731872745;
        
        AggregatorLib.msm(buf, 0, 1);
    }

    function hash(uint256[] memory absorbing, uint256 length)
        private
        view
        returns (bytes32[1] memory v)
    {
        
        bytes memory tmp = new bytes(32 * length + 1);
        tmp[length * 32] = 0;
        for (uint256 i = 0; i < length; i++) {
            uint256 offset = 32 + (i * 32);
            uint256 data = absorbing[i];
            assembly { mstore(add(tmp, offset), data) }
        }
        v[0] = keccak256(tmp);
        
    }

    function squeeze_challenge(uint256[] memory absorbing, uint256 length) internal view returns (uint256 v) {
        absorbing[length] = 0;
        bytes32 res = hash(absorbing, length)[0];
        absorbing[0] = uint256(res);
        v = absorbing[0] % AggregatorLib.q_mod;
    }

    function get_challenges(
        uint256[] calldata transcript,
        uint256[] memory buf // buf[0..1] is instance_commitment
    ) internal view {
        return get_challenges_shplonk(transcript, buf);
    }

    function get_challenges_shplonk(
        uint256[] calldata transcript,
        uint256[] memory buf // buf[0..1] is instance_commitment
    ) internal view {
        
        
        uint256[] memory absorbing = new uint256[](112);
        absorbing[0] = 8987513744584090369347489657311893833926946877426413758008060670913747976065;
        absorbing[1] = buf[0];
        absorbing[2] = buf[1];

        uint256 pos = 3;
        uint256 transcript_pos = 0;
        for (uint i = 0; i < 8; i ++) {
            AggregatorLib.check_on_curve(transcript[transcript_pos], transcript[transcript_pos + 1]);
            absorbing[pos++] = transcript[transcript_pos++];
            absorbing[pos++] = transcript[transcript_pos++];
        }
        // theta
        buf[2] = squeeze_challenge(absorbing, pos);
        
        
        pos = 1;
        for (uint i = 0; i < 4; i ++) {
            AggregatorLib.check_on_curve(transcript[transcript_pos], transcript[transcript_pos + 1]);
            absorbing[pos++] = transcript[transcript_pos++];
            absorbing[pos++] = transcript[transcript_pos++];
        }
        // beta
        buf[3] = squeeze_challenge(absorbing, pos);
        
        
        pos = 1;
        // gamma
        buf[4] = squeeze_challenge(absorbing, pos);
        
        
        pos = 1;
        for (uint i = 0; i < 7; i ++) {
            AggregatorLib.check_on_curve(transcript[transcript_pos], transcript[transcript_pos + 1]);
            absorbing[pos++] = transcript[transcript_pos++];
            absorbing[pos++] = transcript[transcript_pos++];
        }
        // y
        buf[5] = squeeze_challenge(absorbing, pos);
        
        
        pos = 1;
        for (uint i = 0; i < 3; i ++) {
            AggregatorLib.check_on_curve(transcript[transcript_pos], transcript[transcript_pos + 1]);
            absorbing[pos++] = transcript[transcript_pos++];
            absorbing[pos++] = transcript[transcript_pos++];
        }
        //x
        buf[6] = squeeze_challenge(absorbing, pos);
        
        
        pos = 1;
        for (uint i = 0; i < 56; i ++) {
            absorbing[pos++] = transcript[transcript_pos++];
        }
        //y
        buf[7] = squeeze_challenge(absorbing, pos);
        
        
        pos = 1;
        //v
        buf[8] = squeeze_challenge(absorbing, pos);
        
        

        AggregatorLib.check_on_curve(transcript[transcript_pos], transcript[transcript_pos + 1]);
        absorbing[pos++] = transcript[transcript_pos++];
        absorbing[pos++] = transcript[transcript_pos++];
        
        //u
        buf[9] = squeeze_challenge(absorbing, pos);
        
        

        AggregatorLib.check_on_curve(transcript[transcript_pos], transcript[transcript_pos + 1]);
    }
}
