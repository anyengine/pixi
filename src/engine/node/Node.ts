import * as PIXI from "pixi.js";
import Position from "../geom/position/Position";
import AbstractNode from "./AbstractNode";
import {assignPosition} from "../geom/utils";

/**
 * Noeud simple au sens conteneur PIXI : possède des enfants
 * Toute la hiérarchie d'une scène se base sur ces noeuds
 */
export default class Node extends AbstractNode {
  public readonly _internal: PIXI.Container;
  private children: AbstractNode[] = [];

  public constructor(position: Position = Position.zero()) {
    super(position);
    this._internal = new PIXI.Container();
    assignPosition(this._internal, position);
  }

  /**
   * Sans effet.
   * A redéfinir dans les sous-classes.
   */
  protected async _create(): Promise<void> {
  }

  /**
   * Ajoute un enfant à ce noeud et charge ses dépendances si nécessaire (just-in-time loading)
   * This method is asynchronous and resolves when the dependency is loaded.
   * @param child
   */
  public add<T extends AbstractNode>(child: T): T & PromiseLike<T>{
    if (child._parent) throw new Error("Child already has a parent");
    child._parent = this;

    this.children.push(child);
    this.load(child);

    if (child.internal) {
      this._internal.addChild(child.internal);
    } else {
      child.onLoaded.subscribeOnce(node => {
        this._internal.addChild(node.internal)
      });
    }

    // @ts-ignore
    return child;
  }

  /**
   * Supprime un enfant de ce noeud et apppelle destroy() sur cet enfant pour nettoyer
   * @param child
   * @returns true si l'enfant était présent
   */
  public remove(child: AbstractNode): boolean {
    const index = this.children.indexOf(child);
    if (index === -1) return false;
    child._parent = null;
    this.children.splice(index, 1)[0].destroy();
    return true;
  }

  public async _destroy(): Promise<void> {
    this._internal.destroy();
  }
}
