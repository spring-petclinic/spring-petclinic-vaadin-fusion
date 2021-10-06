import { html, nothing, PropertyValues } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { createRef, ref, Ref } from 'lit/directives/ref';
import { Binder, field } from '@vaadin/form';
import { Router } from '@vaadin/router';
import { selectRenderer } from 'lit-vaadin-helpers';
import '@vaadin/vaadin-button/vaadin-button';
import '@vaadin/vaadin-form-layout/vaadin-form-layout';
import '@vaadin/vaadin-form-layout/vaadin-form-item';
import '@vaadin/vaadin-item/vaadin-item';
import '@vaadin/vaadin-list-box/vaadin-list-box';
import '@vaadin/vaadin-select/vaadin-select';
import { Select } from '@vaadin/vaadin-select/vaadin-select';
import '@vaadin/vaadin-text-field/vaadin-text-field';
import { View } from '../../views/view';
import { router } from 'Frontend/index';
import { OwnerEndpoint, PetEndpoint } from 'Frontend/generated/endpoints';
import Owner
  from 'Frontend/generated/org/springframework/samples/petclinic/owner/Owner';
import PetDTO
  from 'Frontend/generated/org/springframework/samples/petclinic/dto/PetDTO';
import PetDTOModel
  from 'Frontend/generated/org/springframework/samples/petclinic/dto/PetDTOModel';
import { EndpointError } from '@vaadin/fusion-frontend';
import PetType
  from 'Frontend/generated/org/springframework/samples/petclinic/owner/PetType';

@customElement('create-or-update-pet-view')
export class CreateOrUpdatePetView extends View {
  @state()
  private owner?: Owner;

  @state()
  private pet?: PetDTO;

  @state()
  private petTypes?: ReadonlyArray<PetType>;

  @state()
  private error?: string;

  private binder = new Binder(this, PetDTOModel);

  private selectRef: Ref<Select> = createRef();

  connectedCallback() {
    super.connectedCallback();
    const ownerId = parseInt(router.location.params.ownerId as string);
    this.fetchOwner(ownerId);
    this.fetchPetTypes();
    if (router.location.route?.name === 'edit-pet') {
      const petId = parseInt(router.location.params.petId as string);
      this.fetchPet(petId);
    }
  }

  async fetchOwner(id: number) {
    this.owner = undefined;
    try {
      this.owner = await OwnerEndpoint.findById(id);
      if (this.owner?.id) {
        this.binder.value = { ...this.binder.value, ownerId: this.owner.id };
      }
    } finally {
      if (!this.owner) {
        this.error = `No owner found with id ${id}`;
      }
    }
  }

  async fetchPetTypes() {
    this.petTypes = undefined;
    try {
      this.petTypes = await PetEndpoint.findPetTypes();
    } finally {
      if (!this.petTypes) {
        this.error = `Error fetching pet types`;
      }
    }
  }

  async fetchPet(id: number) {
    this.owner = undefined;
    this.pet = undefined;
    this.binder.clear();
    try {
      this.pet = await PetEndpoint.findById(id);
    } finally {
      if (this.pet) {
        this.binder.read(this.pet);
      } else {
        this.error = `No pet found with id ${id}`;
      }
    }
  }

  async updated(changedProperties: PropertyValues) {
    if (changedProperties.has('petTypes')) {
      // Need to manually trigger the select renderer whenever the item set changes dynamically
      this.selectRef.value?.requestContentUpdate();
    }
  }

  render() {
    const model = this.binder.model;
    const submitButtonText = !this.pet ? 'Add Pet' : 'Update Pet';
    return html`
      <h2>Pet</h2>
      
      <vaadin-form-layout>
        <vaadin-form-item colspan="2">
          <span slot="label">Owner</span>
          ${this.owner?.firstName} ${this.owner?.lastName}
        </vaadin-form-item>
        <vaadin-form-item>
          <label slot="label">Name</label>
          <vaadin-text-field ${field(model.name)}></vaadin-text-field>
        </vaadin-form-item>
        <vaadin-form-item>
          <label slot="label">Birth Date</label>
          <vaadin-text-field ${field(model.birthDate)}></vaadin-text-field>
        </vaadin-form-item>
        <vaadin-form-item>
          <label slot="label">Type</label>
          <vaadin-select
            ${ref(this.selectRef)}
            ${field(model.typeId)}
            ${selectRenderer(
              () => html`
                <vaadin-list-box>
                  ${this.petTypes?.map(
                    ({ id, name }) =>
                      html`<vaadin-item .value="${id}">${name}</vaadin-item>` 
                  )}
                </vaadin-list-box>
              `
            )}
          ></vaadin-select>
        </vaadin-form-item>
      </vaadin-form-layout>
      <vaadin-button @click="${this.submit}">${submitButtonText}</vaadin-button><br>
      ${this.error !== undefined
        ? html`<p class="error">${this.error}</p>`
        : nothing }
    `;
  }

  async submit() {
    this.error = undefined;
    let petId: number;
    try {
      petId = await this.binder.submitTo(PetEndpoint.save);
    } catch (e) {
      if (!(e instanceof EndpointError)) {
        this.error = 'Saving pet failed due to network error. Try again later.';
      } else {
        this.error = 'Saving pet failed due to server error';
      }
      console.error(e);
      return;
    }
    const targetUrl = router.urlForName('owner-details', { ownerId: this.owner!.id!.toString() });
    Router.go(targetUrl);
  }
}
