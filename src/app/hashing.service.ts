import {Injectable} from '@angular/core';

declare let sjcl;

@Injectable({
    providedIn: 'root'
})
export class HashingService {


    static getGTIDHash(gtid) {
        const bitArray = sjcl.hash.sha256.hash(gtid);
        return sjcl.codec.hex.fromBits(bitArray);
    }

    static getName(hashedName, gtid) {
        const hashJson = sjcl.codec.utf8String.fromBits(sjcl.codec.base64.toBits(hashedName));
        return sjcl.decrypt(gtid, hashJson);
    }

    static getNameHash(name, gtid) {
        return sjcl.codec.base64.fromBits(sjcl.codec.utf8String.toBits(sjcl.encrypt(gtid, name)));
    }

}
