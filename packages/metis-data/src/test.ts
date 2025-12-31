import { ArrayOf, F32, StructOf, Vec } from "./descriptors";
import { allocate } from "./memory";

const Position = StructOf({
    position: Vec(F32, 2),
    color: Vec(F32, 3),
});

const Quad = ArrayOf(Position, 4);

console.log(`${Position.toString()} = ${Position.byteSize} bytes`);
console.log(`position offset:    ${Position.offsetOf("position")}`);
console.log(`color offset:       ${Position.offsetOf("color")}`);
console.log(`position alignment: ${Position.members.position.alignment}`);
console.log(`color alignment:    ${Position.members.color.alignment}`);
console.log(`${Quad.toString()} = ${Quad.byteSize} bytes`);

/*const data = new ArrayBuffer(Quad.byteSize);
Position.members.position.view(data, Quad.offsetAt(0) + Position.offsetOf("position")).set([1, 2]);
Position.members.position.view(data, Quad.offsetAt(1) + Position.offsetOf("position")).set([3, 4]);
Position.members.position.view(data, Quad.offsetAt(2) + Position.offsetOf("position")).set([5, 6]);
Position.members.position.view(data, Quad.offsetAt(3) + Position.offsetOf("position")).set([7, 8]);

Position.members.color.view(data, Quad.offsetAt(0) + Position.offsetOf("color")).set([1, 2, 1]);
Position.members.color.view(data, Quad.offsetAt(1) + Position.offsetOf("color")).set([3, 4, 3]);
Position.members.color.view(data, Quad.offsetAt(2) + Position.offsetOf("color")).set([5, 6, 5]);
Position.members.color.view(data, Quad.offsetAt(3) + Position.offsetOf("color")).set([7, 8, 7]);*/

const data = allocate(Quad);
data.at(0).set({
    position: [1, 2],
    color: [1, 2, 1],
});
data.at(1).set({
    position: [3, 4],
    color: [3, 4, 3],
});
data.at(2).set({
    position: [5, 6],
    color: [5, 6, 5],
});
data.at(3).set({
    position: [7, 8],
    color: [7, 8, 7],
});

console.log(Quad.view(data.buffer, 0));
