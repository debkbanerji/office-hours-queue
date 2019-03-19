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
        return sjcl.encrypt(gtid, hashedName);
    }

    static getNameHash(name, gtid) {
        return sjcl.decrypt(gtid, name);
    }

}
