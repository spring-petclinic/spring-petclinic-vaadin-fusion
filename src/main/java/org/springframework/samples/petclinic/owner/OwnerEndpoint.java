package org.springframework.samples.petclinic.owner;

import java.util.Collection;

import org.springframework.beans.factory.annotation.Autowired;

import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.fusion.Endpoint;
import com.vaadin.fusion.Nonnull;

@Endpoint
@AnonymousAllowed
public class OwnerEndpoint {

	private OwnerRepository service;

	public OwnerEndpoint(@Autowired OwnerRepository service) {
		this.service = service;
	}

	@Nonnull
	public Collection<@Nonnull Owner> findByLastName(String lastName) {
		return this.service.findByLastName(lastName);
	}

	public Owner findById(Integer id) {
		return this.service.findById(id);
	}

	public Integer save(Owner owner) {
		return this.service.save(owner).getId();
	}

}
