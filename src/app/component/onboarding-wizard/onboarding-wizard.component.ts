import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';
import { Constants } from 'src/app/util/Constants';
import { Clipboard } from '@angular/cdk/clipboard';
import { LoginUtil } from 'src/app/util/LoginUtil';
import { TopicService } from '../../service/topic.service';

@Component({
  selector: 'app-onboarding-wizard',
  templateUrl: './onboarding-wizard.component.html',
  styleUrls: ['./onboarding-wizard.component.scss']
})
export class OnboardingWizardComponent {

  @Input()
  open:boolean = false;

  @Output()
  openChange:EventEmitter<boolean> = new EventEmitter<boolean>();

  // Follow list properties (What best describes you?)
  rfpPoster:boolean = false;
  rfpResponder:boolean = false;
  microContractSpecialist:boolean = false;
  enterpriseGovtSpecialist:boolean = false;
  scopeReviewer:boolean = false;
  opportunityDiscoverer:boolean = false;
  participantSupporter:boolean = false;

  // Mute list properties (What do you want to avoid?)
  lowBudgetRepeller:boolean = false;
  vagueScopeRepeller:boolean = false;
  cryptoSpeculativeRepeller:boolean = false;
  sportsEntertainmentRepeller:boolean = false;
  socialChatterRepeller:boolean = false;

  // Advanced filters
  escrowPreference:boolean = false;

  suggestedTopics: string[] = [];
  muteList: string[] = [];
  advancedFilters: string[] = [];
  newUserDisplayName?:string;
  ndkProvider: NdkproviderService;

  constructor(ndkProvider:NdkproviderService, private clipboard:Clipboard, private topicService:TopicService){
    this.ndkProvider = ndkProvider;
  }

  updateTopics(){
    let newTopics = []
    if(this.rfpPoster){
      newTopics.push('rfp','rfpposter','procurement','hirer');
    }
    if(this.rfpResponder){
      newTopics.push('rfp','rfpresponder','bid','proposal','vendor');
    }
    if(this.microContractSpecialist){
      newTopics.push('microcontract','shortterm','gig','freelance');
    }
    if(this.enterpriseGovtSpecialist){
      newTopics.push('enterprise','government','govcontract','corporation');
    }
    if(this.scopeReviewer){
      newTopics.push('scopereview','rfpquality','proposalreview');
    }
    if(this.opportunityDiscoverer){
      newTopics.push('opportunity','earlyaccess','marketresearch');
    }
    if(this.participantSupporter){
      newTopics.push('onboarding','support','newparticipants','community');
    }
    this.suggestedTopics = newTopics
  }

  updateMuteList(){
    let mutedTopics = []
    if(this.lowBudgetRepeller){
      mutedTopics.push('lowbudget','unpaid','freelance')
    }
    if(this.vagueScopeRepeller){
      mutedTopics.push('vaguescope','poorlydefined','unclear')
    }
    if(this.cryptoSpeculativeRepeller){
      mutedTopics.push('crypto','speculative','cryptoonly','nft')
    }
    if(this.sportsEntertainmentRepeller){
      mutedTopics.push('sports','entertainment','sponsorship')
    }
    if(this.socialChatterRepeller){
      mutedTopics.push('social','chatter','offtopic','nonwork')
    }
    this.muteList = mutedTopics;
  }

  updateAdvancedFilters(){
    let filters = []
    if(this.escrowPreference){
      filters.push('Escrow/Milestone Payments')
    }
    this.advancedFilters = filters;
  }

  async acceptChoices(){
    if(this.ndkProvider.isTryingZapddit){
      this.ndkProvider.appData.followedTopics = this.suggestedTopics.join(',');
      this.ndkProvider.followedTopicsEmitter.emit(this.ndkProvider.appData.followedTopics);
      this.ndkProvider.appData.mutedTopics = this.muteList.join(",");
      this.ndkProvider.mutedTopicsEmitter.emit(this.ndkProvider.appData.mutedTopics);
      localStorage.setItem(Constants.FOLLOWEDTOPICS,this.ndkProvider.appData.followedTopics);
      localStorage.setItem(Constants.MUTEDTOPICS,this.ndkProvider.appData.mutedTopics);
      this.ndkProvider.setNotNewToNostr();
      return;
    }
    let alreadyFollowedTopics:string[] = []
    let followedTopicsToBePublished = []
    let alreadyFollowedTopicsString = this.ndkProvider.appData.followedTopics;
    if(alreadyFollowedTopicsString === ''){
      alreadyFollowedTopics = [];
    } else {
      alreadyFollowedTopics = alreadyFollowedTopicsString.split(",");
    }
    followedTopicsToBePublished = [...alreadyFollowedTopics,...this.suggestedTopics];
    followedTopicsToBePublished = [...new Set(followedTopicsToBePublished)];

    let alreadyMutedTopics:string[] = []
    let mutedTopicsToBePublished = []
    let alreadyMutedTopicsString = this.ndkProvider.appData.mutedTopics;
    if(alreadyMutedTopicsString === ''){
      alreadyMutedTopics = [];
    } else {
      alreadyMutedTopics = alreadyMutedTopicsString.split(",");
    }
    mutedTopicsToBePublished = [...alreadyMutedTopics,...this.muteList];
    mutedTopicsToBePublished = [...new Set(mutedTopicsToBePublished)];

    if(this.newUserDisplayName){
      //create new profile event and send it across
      await this.ndkProvider.createNewUserOnNostr(this.newUserDisplayName);
    }
    localStorage.setItem(Constants.FOLLOWEDTOPICS,followedTopicsToBePublished.join(','));
    localStorage.setItem(Constants.MUTEDTOPICS,mutedTopicsToBePublished.join(','));

    this.ndkProvider.publishAppData(undefined, undefined, mutedTopicsToBePublished.join(','));
    await this.topicService.followTopicsInteroperableList(followedTopicsToBePublished);
    this.ndkProvider.setNotNewToNostr();
  }

  copyPrivateKey(){
    const privateKeyHex = localStorage.getItem('privateKey')
    this.clipboard.copy(LoginUtil.hexToBech32("nsec",privateKeyHex!))
  }

  markWizardClosed(){
    this.open = false;
    this.openChange.emit(this.open)
  }
}
