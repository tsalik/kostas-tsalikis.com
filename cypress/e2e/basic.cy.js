describe('Basic site structure', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('has correct title and meta description', () => {
    cy.title().should('include', 'Kostas Tsalikis')
    cy.get('meta[name="description"]').should('exist')
  })

  it('has working navigation', () => {
    cy.get('nav').should('be.visible')
    cy.get('nav a').should('have.length.at.least', 1)
  })

  it('has footer with social links', () => {
    cy.get('footer').should('be.visible')
    cy.get('footer a[href*="github"]').should('exist')
    cy.get('footer a[href*="twitter"]').should('exist')
  })
})

describe('Blog functionality', () => {
  it('can navigate to posts page', () => {
    cy.visit('/posts')
    cy.get('article').should('have.length.at.least', 1)
  })

  it('can open a blog post', () => {
    cy.visit('/posts')
    cy.get('article a').first().click()
    cy.get('article').should('exist')
    cy.get('h1').should('be.visible')
    cy.get('.content').should('exist')
  })
})

describe('Tag system', () => {
  it('can navigate to tags page', () => {
    cy.visit('/tags')
    cy.get('.tag').should('have.length.at.least', 1)
  })

  it('can click on a tag and see related posts', () => {
    cy.visit('/tags')
    cy.get('.tag a').first().click()
    cy.get('article').should('have.length.at.least', 1)
  })
})

describe('Homepage and Posts', () => {
  it('shows latest post first on homepage', () => {
    cy.visit('/')
    cy.get('article').first().within(() => {
      cy.get('h2 a').should('contain', 'Testing LazyColumn in Compose')
      cy.get('time').should('contain', '2023-07-17')
    })
  })

  it('shows posts in chronological order in archive', () => {
    cy.visit('/posts')
    cy.get('article').first().within(() => {
      cy.get('h2 a').should('contain', 'Testing LazyColumn in Compose')
      cy.get('time').should('contain', '2023-07-17')
    })
  })
})

describe('Tag System', () => {
  it('shows correct post count for tags', () => {
    cy.visit('/tags')
    cy.get('.tag').within(() => {
      cy.contains('testing').parent().should('contain', '1')
      cy.contains('espresso').parent().should('contain', '1')
      cy.contains('jetpack compose').parent().should('contain', '1')
    })
  })

  it('shows correct posts when clicking a tag', () => {
    cy.visit('/tags')
    cy.contains('testing').click()
    cy.get('article').should('have.length', 1)
    cy.get('article h2').should('contain', 'Testing LazyColumn in Compose')
  })
})

describe('Navigation and Structure', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('has working navigation menu', () => {
    cy.get('nav').within(() => {
      cy.get('a[href="/"]').should('be.visible')
      cy.get('a[href="/posts"]').should('be.visible')
      cy.get('a[href="/tags"]').should('be.visible')
    })
  })

  it('has footer with correct social links', () => {
    cy.get('footer').within(() => {
      cy.get('a[href*="github.com/tsalik"]').should('exist')
      cy.get('a[href*="twitter.com/tsalikispk"]').should('exist')
    })
  })
})

describe('Responsive design', () => {
  const sizes = ['iphone-x', 'ipad-2', [1024, 768]]
  
  sizes.forEach(size => {
    it(`displays correctly on ${size} viewport`, () => {
      if (Array.isArray(size)) {
        cy.viewport(size[0], size[1])
      } else {
        cy.viewport(size)
      }
      
      cy.visit('/')
      cy.get('nav').should('be.visible')
      cy.get('article').should('be.visible')
      cy.get('footer').should('be.visible')
    })
  })
}) 