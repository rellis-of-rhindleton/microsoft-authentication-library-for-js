import { expect } from "chai";
import { ClientConfigurationError } from "../../src/error/ClientConfigurationError";
import { AuthorityFactory } from "../../src/authority/AuthorityFactory";
import { TEST_CONFIG, OPENID_CONFIGURATION, TENANT_DISCOVERY_RESPONSE } from "../TestConstants";
import sinon from "sinon";
import { Authority } from "../../src/authority/Authority";


describe("AuthorityFactory.ts Class", function () {
    afterEach(function() {
        sinon.restore();
    })

    describe("CreateInstance", () => {
        it("tests if empty authority url returns null", function (done) {
            let authority: Authority;
            try {
                authority = AuthorityFactory.CreateInstance("", true);
            } catch (e) {
                expect(e).to.equal("No Authority Provided");
                done();
            }
        });

        it("Creates Authority Instance", function () {
            let authority = AuthorityFactory.CreateInstance(TEST_CONFIG.validAuthority, false);

            expect(authority).to.be.instanceOf(Authority);
        });

        it("calls saveMetadataFromConfig if metadata provided", function (done) {
            // Verification of saved metadata is done in separate tests below
            const testMetadata = JSON.stringify(OPENID_CONFIGURATION)
            sinon.stub(AuthorityFactory, "saveMetadataFromConfig").callsFake(function (authorityUrl, metadata) {
                expect(authorityUrl).to.equal(TEST_CONFIG.validAuthority);
                expect(metadata).to.equal(testMetadata);
                done();
            });
            
            AuthorityFactory.CreateInstance(TEST_CONFIG.validAuthority, false, testMetadata);
        });
    });

    describe("saveMetadataFromConfig", () => {
        it("does nothing if json is falsey", () => {
            AuthorityFactory.saveMetadataFromConfig(TEST_CONFIG.validAuthority, "");
            expect(AuthorityFactory.getMetadata(TEST_CONFIG.validAuthority)).to.be.null;
        });

        it("throws if invalid json is provided", done => {
            try {
                AuthorityFactory.saveMetadataFromConfig(TEST_CONFIG.validAuthority, "invalid-json");
            } catch (e) {
                expect(e).instanceOf(ClientConfigurationError);
                expect((e as ClientConfigurationError).errorCode).to.equal("authority_metadata_error");

                // Test should timeout if it doesnt throw
                done();
            }
        });

        it("throws if json is missing required keys", done => {
            try {
                AuthorityFactory.saveMetadataFromConfig(TEST_CONFIG.validAuthority, "{}");
            } catch (e) {
                expect(e).instanceOf(ClientConfigurationError);
                expect((e as ClientConfigurationError).errorCode).to.equal("authority_metadata_error");

                // Test should timeout if it doesnt throw
                done();
            }
        });

        it("parses and stores metadata", () => {
            AuthorityFactory.saveMetadataFromConfig(TEST_CONFIG.validAuthority, JSON.stringify(OPENID_CONFIGURATION));

            expect(AuthorityFactory.getMetadata(TEST_CONFIG.validAuthority)).to.deep.equal(TENANT_DISCOVERY_RESPONSE);
        });
    });
});
