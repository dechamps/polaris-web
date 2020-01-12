describe('Initial Setup', function() {
  it('can be completed', function() {
    cy.visit('/')

    cy.get('h2').should('eq', 'Welcome to Polaris!')
    cy.get('button.submit').click()

    cy.get('h2').should('eq', 'Mount Points')
    cy.get('button.submit').should('be.disabled')
    cy.get('input#source').type('test/collection')
    cy.get('input#name').type('test_music')
    cy.get('button.submit').should('not.be.disabled')
    cy.get('button.submit').click()

    cy.get('h2').should('eq', 'User Account')
    cy.get('button.submit').should('be.disabled')
    cy.get('input#username').type('testUser')
    cy.get('input#password').type('testPassword')
    cy.get('input#password_confirm').type('testPassword')
    cy.get('button.submit').should('not.be.disabled')
    cy.get('button.submit').click()

    cy.get('main menu').should('exist')
  })
})