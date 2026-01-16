
let imports = {};
imports['__wbindgen_placeholder__'] = module.exports;

function getArrayJsValueFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getDataViewMemory0();
    const result = [];
    for (let i = ptr; i < ptr + 4 * len; i += 4) {
        result.push(wasm.__wbindgen_externrefs.get(mem.getUint32(i, true)));
    }
    wasm.__externref_drop_slice(ptr, len);
    return result;
}

function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint32ArrayMemory0 = null;
function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
function decodeText(ptr, len) {
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    }
}

let WASM_VECTOR_LEN = 0;

const BindingInfoFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bindinginfo_free(ptr >>> 0, 1));

const EntryPointInfoFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_entrypointinfo_free(ptr >>> 0, 1));

const FragmentOutputInfoFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_fragmentoutputinfo_free(ptr >>> 0, 1));

const ReflectionDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_reflectiondata_free(ptr >>> 0, 1));

const StructMemberInfoFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_structmemberinfo_free(ptr >>> 0, 1));

const TypeInfoFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_typeinfo_free(ptr >>> 0, 1));

const VertexInputInfoFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_vertexinputinfo_free(ptr >>> 0, 1));

class BindingInfo {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(BindingInfo.prototype);
        obj.__wbg_ptr = ptr;
        BindingInfoFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BindingInfoFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bindinginfo_free(ptr, 0);
    }
    /**
     * @returns {any}
     */
    toJSON() {
        const ret = wasm.bindinginfo_toJSON(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @returns {string}
     */
    get name() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_bindinginfo_name(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {number}
     */
    get group() {
        const ret = wasm.__wbg_get_bindinginfo_group(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get binding() {
        const ret = wasm.__wbg_get_bindinginfo_binding(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {string}
     */
    get resource_type() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_bindinginfo_resource_type(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string | undefined}
     */
    get type_name() {
        const ret = wasm.__wbg_get_bindinginfo_type_name(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * @returns {boolean}
     */
    get is_readonly() {
        const ret = wasm.__wbg_get_bindinginfo_is_readonly(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) BindingInfo.prototype[Symbol.dispose] = BindingInfo.prototype.free;
exports.BindingInfo = BindingInfo;

class EntryPointInfo {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(EntryPointInfo.prototype);
        obj.__wbg_ptr = ptr;
        EntryPointInfoFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        EntryPointInfoFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_entrypointinfo_free(ptr, 0);
    }
    /**
     * @returns {any}
     */
    toJSON() {
        const ret = wasm.entrypointinfo_toJSON(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @returns {string}
     */
    get name() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_entrypointinfo_name(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get stage() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_entrypointinfo_stage(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {Uint32Array | undefined}
     */
    get workgroup_size() {
        const ret = wasm.__wbg_get_entrypointinfo_workgroup_size(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        }
        return v1;
    }
    /**
     * @returns {BindingInfo[]}
     */
    get bindings() {
        const ret = wasm.__wbg_get_entrypointinfo_bindings(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {VertexInputInfo[]}
     */
    get vertex_inputs() {
        const ret = wasm.__wbg_get_entrypointinfo_vertex_inputs(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {FragmentOutputInfo[]}
     */
    get fragment_outputs() {
        const ret = wasm.__wbg_get_entrypointinfo_fragment_outputs(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}
if (Symbol.dispose) EntryPointInfo.prototype[Symbol.dispose] = EntryPointInfo.prototype.free;
exports.EntryPointInfo = EntryPointInfo;

class FragmentOutputInfo {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(FragmentOutputInfo.prototype);
        obj.__wbg_ptr = ptr;
        FragmentOutputInfoFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FragmentOutputInfoFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_fragmentoutputinfo_free(ptr, 0);
    }
    /**
     * @returns {any}
     */
    toJSON() {
        const ret = wasm.fragmentoutputinfo_toJSON(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @returns {string}
     */
    get name() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_fragmentoutputinfo_name(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {number}
     */
    get location() {
        const ret = wasm.__wbg_get_fragmentoutputinfo_location(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {string}
     */
    get type_name() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_fragmentoutputinfo_type_name(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) FragmentOutputInfo.prototype[Symbol.dispose] = FragmentOutputInfo.prototype.free;
exports.FragmentOutputInfo = FragmentOutputInfo;

class ReflectionData {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ReflectionData.prototype);
        obj.__wbg_ptr = ptr;
        ReflectionDataFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ReflectionDataFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_reflectiondata_free(ptr, 0);
    }
    /**
     * @returns {any}
     */
    toJSON() {
        const ret = wasm.reflectiondata_toJSON(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @returns {EntryPointInfo[]}
     */
    get entry_points() {
        const ret = wasm.__wbg_get_reflectiondata_entry_points(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {TypeInfo[]}
     */
    get types() {
        const ret = wasm.__wbg_get_reflectiondata_types(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}
if (Symbol.dispose) ReflectionData.prototype[Symbol.dispose] = ReflectionData.prototype.free;
exports.ReflectionData = ReflectionData;

class StructMemberInfo {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(StructMemberInfo.prototype);
        obj.__wbg_ptr = ptr;
        StructMemberInfoFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        StructMemberInfoFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_structmemberinfo_free(ptr, 0);
    }
    /**
     * @returns {any}
     */
    toJSON() {
        const ret = wasm.structmemberinfo_toJSON(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @returns {string}
     */
    get name() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_structmemberinfo_name(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get type_name() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_structmemberinfo_type_name(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {number}
     */
    get offset() {
        const ret = wasm.__wbg_get_fragmentoutputinfo_location(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) StructMemberInfo.prototype[Symbol.dispose] = StructMemberInfo.prototype.free;
exports.StructMemberInfo = StructMemberInfo;

class TypeInfo {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TypeInfo.prototype);
        obj.__wbg_ptr = ptr;
        TypeInfoFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TypeInfoFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_typeinfo_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    get name() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_typeinfo_name(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get kind() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_typeinfo_kind(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {StructMemberInfo[] | undefined}
     */
    get members() {
        const ret = wasm.__wbg_get_typeinfo_members(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        }
        return v1;
    }
    /**
     * @returns {any}
     */
    toJSON() {
        const ret = wasm.typeinfo_toJSON(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) TypeInfo.prototype[Symbol.dispose] = TypeInfo.prototype.free;
exports.TypeInfo = TypeInfo;

class VertexInputInfo {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(VertexInputInfo.prototype);
        obj.__wbg_ptr = ptr;
        VertexInputInfoFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        VertexInputInfoFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_vertexinputinfo_free(ptr, 0);
    }
    /**
     * @returns {any}
     */
    toJSON() {
        const ret = wasm.vertexinputinfo_toJSON(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @returns {string}
     */
    get name() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_vertexinputinfo_name(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {number}
     */
    get location() {
        const ret = wasm.__wbg_get_fragmentoutputinfo_location(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {string}
     */
    get type_name() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_vertexinputinfo_type_name(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) VertexInputInfo.prototype[Symbol.dispose] = VertexInputInfo.prototype.free;
exports.VertexInputInfo = VertexInputInfo;

/**
 * Validates WGSL and returns true if valid, false otherwise.
 * @param {string} wgsl
 * @returns {boolean}
 */
function isWgslValid(wgsl) {
    const ptr0 = passStringToWasm0(wgsl, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.isWgslValid(ptr0, len0);
    return ret !== 0;
}
exports.isWgslValid = isWgslValid;

/**
 * Reflects WGSL shader and returns detailed information about entry points,
 * bindings, inputs/outputs, and type definitions.
 * @param {string} wgsl
 * @returns {ReflectionData}
 */
function reflectWgsl(wgsl) {
    const ptr0 = passStringToWasm0(wgsl, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.reflectWgsl(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ReflectionData.__wrap(ret[0]);
}
exports.reflectWgsl = reflectWgsl;

/**
 * SPIR-V binary -> disassembled text for debugging.
 * Takes SPIR-V bytes (little-endian) and returns human-readable assembly.
 * @param {Uint8Array} spirv_bytes
 * @returns {string}
 */
function spirvBinToText(spirv_bytes) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passArray8ToWasm0(spirv_bytes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.spirvBinToText(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}
exports.spirvBinToText = spirvBinToText;

/**
 * Only validates WGSL (throws JS error if invalid).
 * @param {string} wgsl
 */
function validateWgsl(wgsl) {
    const ptr0 = passStringToWasm0(wgsl, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.validateWgsl(ptr0, len0);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}
exports.validateWgsl = validateWgsl;

/**
 * WGSL -> MSL (Metal Shading Language) source code for Metal/macOS/iOS.
 * If entry_point is provided, only compiles that specific entry point.
 * If entry_point is None or empty string, compiles all entry points.
 * @param {string} wgsl
 * @param {string | null} [entry_point]
 * @returns {string}
 */
function wgslToMsl(wgsl, entry_point) {
    let deferred4_0;
    let deferred4_1;
    try {
        const ptr0 = passStringToWasm0(wgsl, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(entry_point) ? 0 : passStringToWasm0(entry_point, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        const ret = wasm.wgslToMsl(ptr0, len0, ptr1, len1);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}
exports.wgslToMsl = wgslToMsl;

/**
 * WGSL -> SPIR-V (binary words -> LE bytes) for Vulkan.
 * If entry_point is provided, only compiles that specific entry point.
 * If entry_point is None or empty string, compiles all entry points.
 * @param {string} wgsl
 * @param {string | null} [entry_point]
 * @returns {Uint8Array}
 */
function wgslToSpirvBin(wgsl, entry_point) {
    const ptr0 = passStringToWasm0(wgsl, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    var ptr1 = isLikeNone(entry_point) ? 0 : passStringToWasm0(entry_point, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    const ret = wasm.wgslToSpirvBin(ptr0, len0, ptr1, len1);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v3 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v3;
}
exports.wgslToSpirvBin = wgslToSpirvBin;

exports.__wbg_String_8f0eb39a4a4c2f66 = function(arg0, arg1) {
    const ret = String(arg1);
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

exports.__wbg___wbindgen_throw_dd24417ed36fc46e = function(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

exports.__wbg_bindinginfo_new = function(arg0) {
    const ret = BindingInfo.__wrap(arg0);
    return ret;
};

exports.__wbg_entrypointinfo_new = function(arg0) {
    const ret = EntryPointInfo.__wrap(arg0);
    return ret;
};

exports.__wbg_fragmentoutputinfo_new = function(arg0) {
    const ret = FragmentOutputInfo.__wrap(arg0);
    return ret;
};

exports.__wbg_new_1ba21ce319a06297 = function() {
    const ret = new Object();
    return ret;
};

exports.__wbg_new_25f239778d6112b9 = function() {
    const ret = new Array();
    return ret;
};

exports.__wbg_set_3f1d0b984ed272ed = function(arg0, arg1, arg2) {
    arg0[arg1] = arg2;
};

exports.__wbg_set_7df433eea03a5c14 = function(arg0, arg1, arg2) {
    arg0[arg1 >>> 0] = arg2;
};

exports.__wbg_structmemberinfo_new = function(arg0) {
    const ret = StructMemberInfo.__wrap(arg0);
    return ret;
};

exports.__wbg_typeinfo_new = function(arg0) {
    const ret = TypeInfo.__wrap(arg0);
    return ret;
};

exports.__wbg_vertexinputinfo_new = function(arg0) {
    const ret = VertexInputInfo.__wrap(arg0);
    return ret;
};

exports.__wbindgen_cast_2241b6af4c4b2941 = function(arg0, arg1) {
    // Cast intrinsic for `Ref(String) -> Externref`.
    const ret = getStringFromWasm0(arg0, arg1);
    return ret;
};

exports.__wbindgen_cast_d6cd19b81560fd6e = function(arg0) {
    // Cast intrinsic for `F64 -> Externref`.
    const ret = arg0;
    return ret;
};

exports.__wbindgen_init_externref_table = function() {
    const table = wasm.__wbindgen_externrefs;
    const offset = table.grow(4);
    table.set(0, undefined);
    table.set(offset + 0, undefined);
    table.set(offset + 1, null);
    table.set(offset + 2, true);
    table.set(offset + 3, false);
};

const wasmPath = `${__dirname}/naga_wasm_bg.wasm`;
const wasmBytes = require('fs').readFileSync(wasmPath);
const wasmModule = new WebAssembly.Module(wasmBytes);
const wasm = exports.__wasm = new WebAssembly.Instance(wasmModule, imports).exports;

wasm.__wbindgen_start();
