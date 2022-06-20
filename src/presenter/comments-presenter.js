import { remove, render, replace } from '../framework/render.js';
import FilmCommentsView from '../view/film-comments-view.js';
import {UpdateType, UserAction} from '../const.js';

export default class FilmCommentsPresenter {
  #commentsContainer = null;
  #commentsComponent = null;
  #commentsModel = null;
  #changeData = null;
  #film = null;
  #comments = null;

  constructor(commentsContainer, film, commentsModel, changeData) {
    this.#commentsContainer = commentsContainer;
    this.#commentsModel = commentsModel;
    this.#changeData = changeData;
    this.#film = film;
  }

  destroy = () => {
    remove(this.#commentsComponent);
  };

  init = async (film) => {
    this.#comments = await this.#commentsModel.init(film).then(() => this.#commentsModel.comments);
    const prevCommentsComponent = this.#commentsComponent;
    this.#commentsComponent = new FilmCommentsView(film, this.#comments);
    this.#commentsComponent.setCommentDeleteClickHandler(this.#handleCommentDeleteClick);
    this.#commentsComponent.setCommentAddHandler(this.#handleCommentAdd);
    if (!prevCommentsComponent) {
      render(this.#commentsComponent, this.#commentsContainer);
      return;
    }
    if (this.#commentsContainer.contains(prevCommentsComponent.element)) {
      replace(this.#commentsComponent, prevCommentsComponent);
    }
    remove(prevCommentsComponent);
  };

  reset = (film) => {
    this.#commentsComponent.reset(film);
  };

  setAdding = () => {
    this.#commentsComponent.updateElement({
      isDisabled: true,
      isAdding: true,
    });
  };

  setDeleting = (commentId) => {
    this.#commentsComponent.updateElement({
      isDisabled: true,
      isDeleting: true,
      deletingCommentId: commentId,
    });
  };

  resetFormState = () => {
    this.#commentsComponent.updateElement({
      isDisabled: false,
      isSaving: false,
      isDeleting: false,
      deletingCommentId: null
    });
  };

  setAborting = () => {
    this.#commentsComponent.shake(this.resetFormState);
  };

  #handleCommentDeleteClick = async (commentId) => {
    this.setDeleting(commentId);
    try {
      await this.#commentsModel.deleteComment(
        UpdateType.MINOR,
        this.#comments,
        commentId
      );

      this.#changeData(
        UserAction.DELETE_COMMENT,
        UpdateType.MINOR,
        {...this.#film, comments: this.#film.comments.filter((filmCommentId) => filmCommentId !== commentId)}
      );
    } catch {
      this.setAborting();
    }
  };

  #handleCommentAdd = async (update) => {
    this.setAdding();

    try {
      const updatedFilm = await this.#commentsModel.addComment(
        UpdateType.MINOR,
        this.#film.id,
        update
      );

      this.#changeData(
        UserAction.ADD_COMMENT,
        UpdateType.PATCH,
        { ...this.#film, comments: updatedFilm.comments }
      );
    } catch {
      this.setAborting();
    }
  };
}
