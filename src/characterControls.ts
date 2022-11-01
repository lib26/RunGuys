import * as THREE from "three";
import { A, D, DIRECTIONS, S, W, SPACE } from "./utils";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export class CharacterControls {
  model: THREE.Group;
  mixer: THREE.AnimationMixer;
  animationsMap: Map<string, THREE.AnimationAction> = new Map(); // walking, Run, Idle
  orbitControl: OrbitControls;
  camera: THREE.Camera;

  // state
  toggleRun: boolean = true;
  toggleJump: boolean = false;
  toggleBack: boolean = false;
  toggleFinish: boolean = false;
  currentAction: string;

  // temporary data
  walkDirection = new THREE.Vector3();
  rotateAngle = new THREE.Vector3(0, 1, 0);
  rotateQuarternion: THREE.Quaternion = new THREE.Quaternion();
  cameraTarget = new THREE.Vector3();

  // constants
  fadeDuration: number = 0.2;
  runVelocity = 10;
  walkVelocity = 3;
  jumpTime = 0;
  backTime = 0;

  constructor(
    model: THREE.Group,
    mixer: THREE.AnimationMixer,
    animationsMap: Map<string, THREE.AnimationAction>,
    orbitControl: OrbitControls,
    camera: THREE.Camera,
    currentAction: string
  ) {
    this.model = model;
    this.mixer = mixer;
    this.animationsMap = animationsMap;
    this.currentAction = currentAction;
    this.animationsMap.forEach((value, key) => {
      if (key == currentAction) {
        value.play();
      }
    });

    this.orbitControl = orbitControl;
    this.camera = camera;
    this.updateCameraTarget(0, 0, "none");
  }

  public switchRunToggle() {
    this.toggleRun = !this.toggleRun;
  }

  public switchJumpToggle() {
    this.jumpTime = 0;
    this.toggleJump = true;
    const jumpTimeout = setTimeout(() => {
      this.toggleJump = false;
    }, 1000);
  }
  public switchBackToggle() {
    this.backTime = 0;
    this.toggleBack = true;
    const jumpBackout = setTimeout(() => {
      this.toggleBack = false;
    }, 1000);
  }

  public switchFinishToggle() {
    this.toggleFinish = !this.toggleFinish;
  }

  public update(delta: number, keysPressed: any) {
    const directionPressed = DIRECTIONS.some((key) => keysPressed[key] == true);
    // available animation
    // falling
    // backward
    // idle
    // running
    // walking
    // jump
    console.log(this.toggleFinish);
    var play = "";
    if (this.toggleBack) {
      play = "backward";
    } else if (directionPressed && this.toggleRun && !this.toggleJump) {
      play = "running";
    } 
    else if (this.toggleFinish) {
      play = "Cheering";
    }else if (directionPressed && !this.toggleJump) {
      play = "walking";
    } else {
      if (this.toggleJump) {
        play = "jump";
      } else {
        play = "idle";
      }
    }

    if (this.currentAction != play) {
      
        const toPlay = this.animationsMap.get(play);
        const current = this.animationsMap.get(this.currentAction);

        current.fadeOut(this.fadeDuration);
        toPlay.reset().fadeIn(this.fadeDuration).play();

        this.currentAction = play;
    }

    this.mixer.update(delta * 1.4);

    if (this.currentAction == "running" || this.currentAction == "walking") {
      if (this.model.position.y >= 0.08) {
        this.model.position.y -= 0.02;
      }

      // calculate towards camera direction
      var angleYCameraDirection = Math.atan2(
        this.camera.position.x - this.model.position.x,
        this.camera.position.z - this.model.position.z
      );
      // diagonal movement angle offset
      var directionOffset = this.directionOffset(keysPressed);

      // rotate model
      this.rotateQuarternion.setFromAxisAngle(
        this.rotateAngle,
        directionOffset
      );
      this.model.quaternion.rotateTowards(this.rotateQuarternion, 0.2);

      // calculate direction
      this.camera.getWorldDirection(this.walkDirection);
      this.walkDirection.y = 0;
      this.walkDirection.normalize();
      this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset);

      // run/walk velocity
      const velocity = this.runVelocity;

      // move model & camera
      const moveX = this.walkDirection.x * velocity * delta;
      const moveZ = this.walkDirection.z * velocity * delta;
      this.model.position.x += moveX;
      this.model.position.z += moveZ;
      this.updateCameraTarget(moveX, moveZ, this.currentAction);

      // let testButton = document.getElementById('testButton') as HTMLElement;
      // console.log('button: '+ JSON.stringify(testButton));
      // testButton.addEventListener("click", () => {
      //   alert("clicked!");
      // });

      // z가 210보다 높고 x가 -8.4부터 8.4사이가 결승선
      if(this.model.position.z >= 210.5 && (this.model.position.x <= 8.4 && this.model.position.x >= -8.4)){
        document.getElementById("youWIN").style.display = "block";
        // alert("GAME IS OVER");
      }
      console.log('x: '+ this.model.position.x);
      console.log('z: '+ this.model.position.z);

      console.log(this.model);
      console.log(this.model.position);
    }

    if (this.currentAction == "jump") {
      this.mixer.update(delta * 1.4);
      // diagonal movement angle offset
      var directionOffset = this.directionOffset(keysPressed);

      // calculate direction
      this.camera.getWorldDirection(this.walkDirection);
      this.walkDirection.normalize();
      this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset);

      const velocity = this.runVelocity;

      // move model & camera
      const moveX = this.walkDirection.x * velocity * delta;
      const moveZ = this.walkDirection.z * velocity * delta;

      if (this.jumpTime >= 30) {
        this.model.position.x += moveX;
        this.model.position.z += moveZ;
        this.model.position.y -= 0.092;
        this.jumpTime += 1;
        if (this.jumpTime == 60) {
          this.jumpTime = 0;
          this.model.position.y = 0.08;
        }
      } else {
        this.model.position.x += moveX;
        this.model.position.z += moveZ;
        this.model.position.y += 0.085;
        this.jumpTime += 1;
      }
      // console.log("jumpTime: "+this.jumpTime);
      // console.log(this.model.position.y);
      this.updateCameraTarget(moveX, moveZ, this.currentAction);
    }

    if (this.currentAction == "backward") {
      this.mixer.update(delta * 0.5);
      // diagonal movement angle offset
      var directionOffset = this.directionOffset(keysPressed);

      // calculate direction
      this.camera.getWorldDirection(this.walkDirection);
      this.walkDirection.normalize();
      this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset);

      const velocity = this.runVelocity;

      // move model & camera
      const moveX = this.walkDirection.x * velocity * delta * 0.5;
      const moveZ = this.walkDirection.z * velocity * delta * 0.5;

      this.model.position.x -= moveX;
      this.model.position.z -= moveZ;

      // console.log("jumpTime: "+this.jumpTime);
      // console.log(this.model.position.y);
      this.updateCameraTarget(moveX, moveZ, this.currentAction);
    }
    if (this.currentAction == "finish") {
      
      console.log("finish");
    }
  }

  private updateCameraTarget(moveX: number, moveZ: number, Action: String) {
    // // move camera
    // this.camera.position.x += moveX
    // this.camera.position.z += moveZ
    // this.camera.position.y += moveY

    if (Action == "running" || Action == "walking") {
      // move camera
      this.camera.position.x = this.camera.position.x + moveX;
      this.camera.position.z = this.camera.position.z + moveZ;

      // update camera target
      this.cameraTarget.x = this.model.position.x;
      this.cameraTarget.z = this.model.position.z;
      this.orbitControl.target = this.cameraTarget;
    } else if (Action == "jump") {
      // move camera
      if (this.jumpTime >= 20) {
        this.camera.position.y = this.camera.position.y + 0.08;
      } else {
        this.camera.position.x = this.camera.position.x + moveX;
        this.camera.position.z = this.camera.position.z + moveZ;
        this.camera.position.y = this.camera.position.y - 0.08;
      }
      this.cameraTarget.x = this.model.position.x;
      this.cameraTarget.z = this.model.position.z;
      this.cameraTarget.y = this.model.position.y;

      // update camera target
    } else if (Action == "backward") {
      this.camera.position.x = this.camera.position.x - moveX;
      this.camera.position.z = this.camera.position.z - moveZ;

      this.cameraTarget.x = this.model.position.x;
      this.cameraTarget.z = this.model.position.z;
      this.cameraTarget.y = this.model.position.y;

      this.orbitControl.target = this.cameraTarget;
      // update camera target
    }
  }

  private directionOffset(keysPressed: any) {
    var directionOffset = 0; // w

    if (keysPressed[W]) {
      if (keysPressed[A]) {
        directionOffset = Math.PI / 4; // w+a
      } else if (keysPressed[D]) {
        directionOffset = -Math.PI / 4; // w+d
      }
    } else if (keysPressed[S]) {
      if (keysPressed[A]) {
        directionOffset = Math.PI / 4 + Math.PI / 2; // s+a
      } else if (keysPressed[D]) {
        directionOffset = -Math.PI / 4 - Math.PI / 2; // s+d
      } else {
        directionOffset = Math.PI; // s
      }
    } else if (keysPressed[A]) {
      directionOffset = Math.PI / 2; // a
    } else if (keysPressed[D]) {
      directionOffset = -Math.PI / 2; // d
    }

    return directionOffset;
  }
}
